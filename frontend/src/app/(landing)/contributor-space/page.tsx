import type { Metadata } from "next";
import {
  getContributors,
  getPullRequestStats,
  getTopContributorsByMergedPRs,
} from "@/lib/github";
import {
  StatsRow,
  TopContributorsList,
  ContributorGrid,
  ContributeCTA,
} from "./ContributorSpaceClient";

const OWNER = process.env.GITHUB_OWNER as string;
const REPO = process.env.GITHUB_REPO as string;
const SITE_URL = process.env.SITE_URL ?? "https://your-domain.com";

const repoLabel = `${OWNER}/${REPO}`;

export const metadata: Metadata = {
  title: `Contributor Space — ${repoLabel} contributors | BackSpaces`,
  description: `Meet the ${repoLabel} contributor community: total contributors, pull requests opened and merged, the top 10 contributors, and everyone who's shipped code.`,
  alternates: {
    canonical: `${SITE_URL}/contributor-space`,
  },
  openGraph: {
    title: `Contributor Space — ${repoLabel}`,
    description: `See who's building ${repoLabel}: contributor stats, top contributors, and how to join in.`,
    url: `${SITE_URL}/contributor-space`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Contributor Space — ${repoLabel}`,
    description: `See who's building ${repoLabel}: contributor stats, top contributors, and how to join in.`,
  },
};

// Revalidate the whole page hourly (ISR) — keeps the page statically served
// and crawlable, while staying reasonably fresh.
export const revalidate = 3600;

export default async function ContributorSpacePage() {
  const [stats, topContributors, allContributors] = await Promise.all([
    getPullRequestStats(),
    getTopContributorsByMergedPRs(10),
    getContributors(),
  ]);

  const contributeHref = `https://github.com/${OWNER}/${REPO}/blob/main/CONTRIBUTING.md`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Contributor Space — ${repoLabel}`,
    description: `Contributors to the ${repoLabel} repository.`,
    url: `${SITE_URL}/contributor-space`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: topContributors.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.login,
        url: c.profileUrl,
      })),
    },
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:mt-20 lg:px-8">
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            Contributor Space
          </h1>
          <p className="mt-1 text-[var(--muted-foreground)]">
            Celebrating the community building{" "}
            <span className="font-mono text-sm">{repoLabel}</span>.
          </p>
        </div>
        <ContributeCTA href={contributeHref} />
      </header>

      <section aria-label="Repository statistics" className="mb-8">
        <StatsRow stats={stats} />
      </section>

      <section aria-label="Top contributors" className="mb-8">
        <TopContributorsList contributors={topContributors} />
      </section>

      <section aria-label="All contributors">
        <ContributorGrid contributors={allContributors} />
      </section>
    </main>
  );
}