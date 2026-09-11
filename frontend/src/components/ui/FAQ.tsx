import { Badge } from "@/components/ui/badge";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Faq5Props {
  badge?: string;
  heading?: string;
  description?: string;
  faqs?: FaqItem[];
}

const defaultFaqs: FaqItem[] = [
  {
    question: "What is Backspaces?",
    answer:
      "Backspaces is a dev space built for students and developers who are eager to code — a place to solve real problems, share what you're building, and grow together, especially where structured mentorship and guidance are hard to come by.",
  },
  {
    question: "Who is Backspaces for?",
    answer:
      "Anyone who wants to learn by building — whether you're just starting out with the basics or already shipping your own projects. No formal experience required.",
  },
  {
    question: "Is Backspaces free to use?",
    answer:
      "Yes, Backspaces is free to join and use. The goal is to make this kind of support accessible to every student who wants it.",
  },
  {
    question: "What kind of problems will I find here?",
    answer:
      "Real, practical challenges pulled from real-world scenarios — not repetitive tutorial exercises you've already done a hundred times.",
  },
  {
    question: "Can I share and get feedback on my own projects?",
    answer:
      "Yes, sharing your work and getting genuine feedback from other developers is a core part of what Backspaces is built for.",
  },
];

export const FAQ = ({
  badge = "FAQ",
  heading = "Common Questions & Answers",
  description = "Find out all the essential details about our platform and how it can serve your needs.",
  faqs = defaultFaqs,
}: Faq5Props) => {
  return (
    <section className="py-32">
      <div className="container">
        <div className="text-center">
          <Badge className="text-xs font-medium">{badge}</Badge>
          <h1 className="mt-4 text-4xl font-semibold">{heading}</h1>
          <p className="mt-6 font-medium text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="mx-auto mt-14 max-w-screen-sm">
          {faqs.map((faq, index) => (
            <div key={index} className="mb-8 flex gap-4">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-secondary font-mono text-xs text-primary">
                {index + 1}
              </span>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-medium">{faq.question}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

