import { ContainerTextFlip } from "@/components/ui/ContainerTextFlip";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Backspaces | A Dev Space for Builders and Learners",
  description:
    "Backspaces is a dev space built for students and developers eager to code — a place to connect, solve real problems, share what you're building, and grow together.",
  keywords: [
    "Backspaces",
    "developer community for students",
    "coding platform for students",
    "dev space India",
    "student developers",
    "learn to code together",
  ],
  openGraph: {
    title: "About Backspaces",
    description:
      "A dev space built for students and developers eager to code — connect, build, and grow together.",
    type: "website",
  },
};

export default function About() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-start justify-center w-full gap-6">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">
            About BackSpaces
          </h1>

          <p className="text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Backspaces is a dev space built for students and developers who
            are eager to code — not just to learn syntax, but to actually
            build things that matter.
          </p>

          <p className="text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Most students don&apos;t have access to a mentor, a senior dev to
            ask questions, or a space where half-finished projects and messy
            code are welcome. Backspaces exists to fill that gap — a place
            where you can share what you&apos;re working on, get real
            feedback, solve genuine problems, and grow alongside people who
            are figuring it out just like you.
          </p>

          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mt-4">
            Why Backspaces exists
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Learning to code alone is hard. Tutorials only take you so far,
            and without guidance, it&apos;s easy to feel stuck or unsure if
            you&apos;re even doing things the right way. Backspaces is built
            to change that — by bringing together students and developers who
            want to build in public, ask the questions they&apos;re afraid to
            ask elsewhere, and push each other to keep going.
          </p>

          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mt-4">
            What you&apos;ll find here
          </h2>
          <ul className="list-disc list-inside text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed space-y-2">
            <li>A space to share your projects, ideas, and progress</li>
            <li>Real problems worth solving, not just toy exercises</li>
            <li>A community that values curiosity over credentials</li>
            <li>Room to fail, iterate, and actually get better</li>
          </ul>

          <p className="text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed mt-4">
            Whether you&apos;re just starting out or already deep into your
            coding journey, Backspaces is a space for you to belong, build,
            and grow.
          </p>
        </div>
      </main>
    </div>
  );
}