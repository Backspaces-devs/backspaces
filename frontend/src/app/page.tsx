import { BackgroundBeams } from "@/components/ui/BackgroundBeams";
import { ContainerTextFlip } from "@/components/ui/ContainerTextFlip";
import Image from "next/image";

export default function Home() {
  return (
    <div className="relative flex flex-col flex-1 items-center justify-center bg-black font-sans min-h-screen overflow-hidden">
      <BackgroundBeams />

      <main className="relative z-10 flex flex-1 w-full max-w-3xl flex-col items-center justify-center py-32 px-16">
        <div className="flex flex-col items-center justify-center w-full">
          <ContainerTextFlip words={["BACKSPACES", "REVOLUTION"]} />
          <button className="shadow-[inset_0_0_0_2px_#616467] text-black text-xs my-5 px-4 py-2 rounded-full tracking-widest uppercase font-bold bg-transparent hover:bg-[#616467] hover:text-white dark:text-neutral-200 transition duration-200">
            Dig In
          </button>
        </div>
      </main>
    </div>
  );
}
