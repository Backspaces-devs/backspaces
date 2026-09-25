export default function ThankYouState() {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 animate-[feedback-pop_500ms_ease-out] items-center justify-center rounded-full bg-emerald-500/10 text-3xl text-emerald-400">
        ✓
      </div>
      <h3 className="mt-5 text-xl font-semibold text-slate-100">
        Thank you for your feedback!
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        Your feedback has been received. It helps us make Backspaces better.
      </p>

      <style jsx>{`
        @keyframes feedback-pop {
          0% { opacity: 0; transform: scale(.5); }
          70% { transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
