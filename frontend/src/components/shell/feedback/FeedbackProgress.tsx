import type { FeedbackStatus } from "@/app/types/feedback";

const steps: FeedbackStatus[] = [
  "In Review",
  "Planned",
  "In Progress",
  "Implemented",
];

const rank: Record<FeedbackStatus, number> = {
  "In Review": 1,
  Planned: 2,
  "In Progress": 3,
  Implemented: 4,
};

export default function FeedbackProgress({
  status,
}: {
  status: FeedbackStatus;
}) {
  const current = rank[status];

  return (
    <div className="overflow-x-auto pb-2">
      <div className="mx-auto flex min-w-[680px] items-start px-3">
        {steps.map((step, index) => {
          const active = rank[step] <= current;
          const currentStep = rank[step] === current;

          return (
            <div key={step} className="flex flex-1 items-start">
              <div className="flex min-w-0 flex-col items-center text-center">
                <div
                  className={[
                    "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-all",
                    active
                      ? "border-violet-400 bg-violet-500 text-white"
                      : "border-slate-700 bg-slate-900 text-slate-500",
                    currentStep ? "ring-4 ring-violet-500/10" : "",
                  ].join(" ")}
                >
                  {active && rank[step] < current ? "✓" : rank[step]}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    active ? "text-slate-200" : "text-slate-500"
                  }`}
                >
                  {step}
                </span>
                {currentStep && (
                  <span className="mt-1 text-[11px] text-slate-500">
                    Current status
                  </span>
                )}
              </div>

              {index < steps.length - 1 && (
                <div
                  className={`mt-4 h-px flex-1 ${
                    rank[steps[index + 1]] <= current
                      ? "bg-violet-500"
                      : "bg-slate-800"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
