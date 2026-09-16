// lib/github.ts
// Server-only. Never import this from a "use client" file —
// it uses process.env.GITHUB_TOKEN which must stay off the client bundle.

const GITHUB_API = "https://api.github.com";

const OWNER = process.env.GITHUB_OWNER as string;
const REPO = process.env.GITHUB_REPO as string;
const TOKEN = process.env.GITHUB_TOKEN as string;

if (!OWNER || !REPO || !TOKEN) {
  // Fails loudly at build/request time instead of silently returning empty data.
  console.warn(
    "[github.ts] Missing GITHUB_OWNER, GITHUB_REPO, or GITHUB_TOKEN env vars."
  );
}

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

// Revalidate every hour. Contributor stats don't need to be live-live,
// and this keeps you comfortably inside GitHub's rate limits.
const REVALIDATE_SECONDS = 60 * 60;

export type Contributor = {
  login: string;
  avatarUrl: string;
  profileUrl: string;
  contributions: number; // commit count, from the /contributors endpoint
};

export type ContributorWithPRs = Contributor & {
  prsMerged: number;
};

export type RepoStats = {
  totalContributors: number;
  pullRequestsOpened: number;
  pullRequestsMerged: number;
};

async function githubFetch(path: string) {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers,
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `GitHub API error ${res.status} for ${path}: ${body.slice(0, 300)}`
    );
  }

  return res.json();
}

/**
 * All contributors, ranked by commit count.
 * Used for: total contributor count + the avatar wall.
 */
export async function getContributors(): Promise<Contributor[]> {
  const results: Contributor[] = [];
  let page = 1;

  while (true) {
    const data = await githubFetch(
      `/repos/${OWNER}/${REPO}/contributors?per_page=100&page=${page}&anon=false`
    );

    if (!Array.isArray(data) || data.length === 0) break;

    for (const c of data) {
      if (!c.login) continue; // skip anonymous entries
      results.push({
        login: c.login,
        avatarUrl: c.avatar_url,
        profileUrl: c.html_url,
        contributions: c.contributions,
      });
    }

    if (data.length < 100) break;
    page += 1;
    if (page > 10) break; // safety cap: 1000 contributors is plenty
  }

  return results;
}

/**
 * Opened + merged PR counts using the Search API,
 * which returns total_count without pagination.
 */
export async function getPullRequestStats(): Promise<RepoStats> {
  const [openedRes, mergedRes] = await Promise.all([
    githubFetch(
      `/search/issues?q=repo:${OWNER}/${REPO}+type:pr&per_page=1`
    ),
    githubFetch(
      `/search/issues?q=repo:${OWNER}/${REPO}+type:pr+is:merged&per_page=1`
    ),
  ]);

  const contributors = await getContributors();

  return {
    totalContributors: contributors.length,
    pullRequestsOpened: openedRes.total_count ?? 0,
    pullRequestsMerged: mergedRes.total_count ?? 0,
  };
}

/**
 * Top contributors ranked by PRs merged (not commits).
 * Paginates merged PRs and tallies by author.
 * Capped at ~500 most recent merged PRs to keep this fast and
 * inside rate limits — raise MAX_PAGES if your repo needs deeper history.
 */
export async function getTopContributorsByMergedPRs(
  limit = 10
): Promise<ContributorWithPRs[]> {
  const MAX_PAGES = 5; // 5 x 100 = 500 merged PRs
  const tally = new Map<string, { avatarUrl: string; profileUrl: string; count: number }>();

  for (let page = 1; page <= MAX_PAGES; page++) {
    const data = await githubFetch(
      `/repos/${OWNER}/${REPO}/pulls?state=closed&per_page=100&page=${page}&sort=updated&direction=desc`
    );

    if (!Array.isArray(data) || data.length === 0) break;

    for (const pr of data) {
      if (!pr.merged_at || !pr.user?.login) continue;
      const key = pr.user.login;
      const existing = tally.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        tally.set(key, {
          avatarUrl: pr.user.avatar_url,
          profileUrl: pr.user.html_url,
          count: 1,
        });
      }
    }

    if (data.length < 100) break;
  }

  return Array.from(tally.entries())
    .map(([login, v]) => ({
      login,
      avatarUrl: v.avatarUrl,
      profileUrl: v.profileUrl,
      contributions: 0,
      prsMerged: v.count,
    }))
    .sort((a, b) => b.prsMerged - a.prsMerged)
    .slice(0, limit);
}