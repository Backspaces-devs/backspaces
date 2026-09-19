import Link from "next/link";
import { FaGithub, FaInstagram, FaDiscord, FaTwitter } from "react-icons/fa";

export const PageFooter = () => {
  const socials = [
    { label: "GitHub", href: "https://github.com/Backspaces-devs/backspaces", Icon: FaGithub },
    { label: "Instagram", href: "https://www.instagram.com/bckspaces/", Icon: FaInstagram },
    { label: "Discord", href: "https://discord.gg/qQ5yvgB2N8", Icon: FaDiscord },
    { label: "Twitter", href: "https://x.com/Backspaces_devs", Icon: FaTwitter },
  ];

  const logoElement = (
    <div className="w-8 h-8 rounded-full overflow-hidden border-0 border-gray-300">
      <img
        src="/logo.svg"
        alt="Logo"
        className="w-full h-full object-cover rounded-full border-2 border-blue-500"
      />
    </div>
  )

  return (
    <footer className="w-full bg-[#0a0a0a] border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-14">
        <div className="flex flex-col lg:flex-row justify-between gap-10">
          <div className="flex flex-col gap-4 max-w-sm">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-full border border-blue-500/50 flex items-center justify-center text-white font-bold text-sm">
                <a href="/">
                  <div className="flex items-center ">
                    {logoElement}
                  </div>
                </a>
              </div>
              <span className="text-[18px] font-semibold text-white">Backspaces</span>
            </div>
            <p className="text-[13px] text-white/50 leading-relaxed">
              A dev space built for students and developers eager to code.
            </p>

            {/* SOCIALS - VISIBLE WHITE CIRCLES */}
            <div className="flex items-center gap-3 mt-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="size-9 flex items-center justify-center rounded-full  text-white hover:bg-white/90 hover:text-black transition-colors"
                >
                  <s.Icon className="size-[20px]" />
                </a>
              ))}
            </div>
          </div>

          <div className="flex gap-12 sm:gap-20">
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Explore</h4>
              <ul className="space-y-2.5 text-[13px] text-white/50">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/discover" className="hover:text-white">Discover</Link></li>
                <li><Link href="/" className="hover:text-white">Home</Link></li>
                <li><Link href="/contribute" className="hover:text-white">Contribute</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2.5 text-[13px] text-white/50">
                <li><Link href="/contribute" className="hover:text-white">Contribute</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-2.5 text-[13px] text-white/50">
                <li><Link href="/help" className="hover:text-white">Help</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="h-px bg-white/[0.06] mt-12 mb-6" />
        <div className="flex flex-col sm:flex-row justify-between gap-3 text-[12px] text-white/40">
          <p>© 2026 Backspaces. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-white/70">Terms and Conditions</Link>
            <Link href="/policy" className="hover:text-white/70">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Also export as default for flexibility
export default PageFooter;
