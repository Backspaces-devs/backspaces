import { ArrowRight } from "lucide-react";

interface NewsCardProps {
  heading: string;
  category: string;
  description: string;
  url: string;
  view?: "grid" | "list";
  source?: string;
  date?: string;
  onReadMore?: () => void;
}

export function NewsCard({ heading, category, description, view = "grid", source, date, onReadMore }: NewsCardProps) {
  const meta = [source, date].filter(Boolean).join(" · ");
  if (view === "list") {
    return (
      <div onClick={onReadMore} className="flex flex-row items-center justify-between gap-3 sm:gap-4 w-full py-4 px-1 sm:px-2 border-b border-white/[0.08] last:border-b-0 hover:bg-white/[0.02] transition-colors group cursor-pointer">
        {/* Left */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
          <h3 className="font-medium text-[14px] sm:text-[15px] leading-snug truncate text-white/90 group-hover:text-white transition-colors">
            {heading}
          </h3>
          <span className="hidden sm:inline-flex shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.06] text-white/40">
            {category}
          </span>
          {meta && (
            <span className="hidden md:inline-flex shrink-0 text-[10px] text-white/30">
              {meta}
            </span>
          )}
          <p className="hidden lg:block text-xs text-white/40 truncate flex-1 max-w-[40%]">
            {description}
          </p>
        </div>

        {/* Right - Read more */}
        <button
          onClick={onReadMore}
          className="flex items-center gap-1.5 text-xs font-medium text-white/40 hover:text-white shrink-0 transition-colors"
        >
          <span className="hidden sm:inline">Read more</span>
          <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    );
  }

  // GRID MODE - keeps bg + border as before
  return (<>
    <div onClick={onReadMore} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 hover:bg-white/[0.07] transition-colors w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] group">
      <h3 className="font-semibold text-base leading-snug line-clamp-2">{heading}</h3>
      <div className="flex items-center gap-2">
        <span className="w-fit text-[11px] px-2 py-1 rounded-full bg-white/10 text-white/60">{category}</span>
        {meta && <span className="text-[10px] text-white/35 truncate">{meta}</span>}
      </div>
      <div className="h-px bg-white/10" />
      <p className="text-sm text-white/50 line-clamp-3">{description}</p>
      <button onClick={onReadMore} className="flex items-center gap-1.5 text-sm font-medium text-white hover:gap-2.5 transition-all w-fit mt-1">
        Read more <ArrowRight className="size-3.5" />
      </button>
    </div>
  </>
  );
}
