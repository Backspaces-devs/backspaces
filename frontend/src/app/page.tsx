import { ContainerTextFlip } from "@/components/ui/ContainerTextFlip";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black min-h-screen">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
        <div className="flex flex-col items-center justify-center w-full">
          <ContainerTextFlip words={["BACKSPACES", "REVOLUTION"]} textClassName="text-4xl sm:text-7xl font-bold"/>
        </div>
      </main>
    </div>
  );
}
