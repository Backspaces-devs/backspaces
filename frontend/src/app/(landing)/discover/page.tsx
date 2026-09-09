import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover Backspaces | What You'll Find Here",
  description:
    "Explore everything Backspaces offers — from real coding problems and project showcases to peer collaboration and growth resources for student developers.",
  keywords: [
    "Backspaces features",
    "coding platform for students",
    "project showcase",
    "developer collaboration",
    "coding problems for students",
    "student dev space",
  ],
  openGraph: {
    title: "Discover Backspaces",
    description:
      "See what Backspaces offers — problems worth solving, projects worth sharing, and a space to grow as a developer.",
    type: "website",
  },
};

const offerings = [
  {
    title: "Real Problems, Not Toy Exercises",
    description:
      "Work on problems that actually challenge you — pulled from real-world scenarios, not repetitive tutorial exercises you've already done a hundred times.",
  },
  {
    title: "Project Showcase",
    description:
      "Share what you're building, get real feedback from other developers, and see what others in the space are working on. Build in public, learn in public.",
  },
  {
    title: "Peer Collaboration",
    description:
      "Find people to team up with, ask questions without judgment, and get unstuck faster — the kind of support most students don't have access to.",
  },
  {
    title: "Learning Resources",
    description:
      "Curated guides, roadmaps, and resources to help you go from confused beginner to confident builder, without getting lost in a hundred open tabs.",
  },
  {
    title: "Hackathons & Challenges",
    description:
      "Participate in coding challenges and hackathon-style events designed to push you to build fast, think on your feet, and ship something real.",
  },
  {
    title: "Growth Tracking",
    description:
      "See your progress over time — problems solved, projects shipped, skills picked up. A clear record of how far you've come.",
  },
];

export default function Discover() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-start justify-center w-full gap-6">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Discover Backspaces
          </h1>

          <p className="text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Backspaces brings together everything a student developer
            actually needs — real problems to solve, a space to share your
            work, and people to grow alongside. Here&apos;s what you&apos;ll
            find.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full mt-6">
            {offerings.map((item) => (
              <div
                key={item.title}
                className="flex flex-col gap-2 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
              >
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                  {item.title}
                </h2>
                <p className="text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <p className="text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed mt-6">
            Whether you&apos;re here to solve your first real problem or ship
            your tenth project, Backspaces gives you the space to do it —
            surrounded by people who get it.
          </p>
        </div>
      </main>
    </div>
  );
}