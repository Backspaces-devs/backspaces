import Image from "next/image";
import { cn } from "@/lib/utils";

interface PlatformCardProps {
  name: string;
  logo: string;
  stat: string;
  statLabel: string;
  rank?: string;
  color: string;
}

export function PlatformCard({ name, logo, stat, statLabel, rank, color }: PlatformCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 sm:p-5 flex flex-col gap-3 hover:bg-white/[0.07] transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="size-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${color}20` }}
          >
            <Image src={logo} alt={name} width={20} height={20} />
          </div>
          <span className="font-semibold text-sm sm:text-base">{name}</span>
        </div>
        {rank && (
          <span className="text-[10px] sm:text-xs px-2 py-1 rounded-full bg-white/10 text-muted-foreground shrink-0">
            {rank}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl sm:text-3xl font-bold" style={{ color }}>
          {stat}
        </p>
        <p className="text-xs text-muted-foreground">{statLabel}</p>
      </div>
    </div>
  );
}