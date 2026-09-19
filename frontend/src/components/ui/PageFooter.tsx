// src/components/ui/PageFooter.tsx - FIXES TS2322 BUILD ERROR
// Accepts props (logo, sections, etc) but also works without them
import Link from "next/link";
import { FaGithub, FaInstagram, FaDiscord, FaTwitter } from "react-icons/fa";
import React from "react";

interface Logo {
  url: string;
  src: string;
  alt: string;
  title: string;
}

interface FooterLink {
  name: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface SocialLink {
  icon?: React.ReactElement;
  Icon?: React.ComponentType<{ className?: string }>;
  href: string;
  label: string;
}

interface FooterProps {
  logo?: Logo;
  sections?: FooterSection[];
  description?: string;
  socialLinks?: SocialLink[] | any[]; // any[] to allow never[] from TS
  copyright?: string;
  legalLinks?: FooterLink[];
}

// Defaults - Backspaces
const defaultLogo: Logo = {
  url: "/",
  src: "https://cdn.21st.dev/assets/mirror/31/312257931df7cfb368e5050011630292d548b932658ebb815c426223f580d172.svg",
  alt: "Backspaces logo",
  title: "Backspaces",
};

const defaultSections: FooterSection[] = [
  { title: "Explore", links: [{ name: "About", href: "/about" }, { name: "Discover", href: "/discover" }, { name: "Home", href: "/" }, { name: "Contribute", href: "/contribute" }] },
  { title: "Company", links: [{ name: "Contribute", href: "/contribute" }, { name: "Contact", href: "/contact" }] },
  { title: "Resources", links: [{ name: "Help", href: "/help" }, { name: "Privacy", href: "/privacy" }] },
];

const defaultSocials: SocialLink[] = [
  { Icon: FaGithub, href: "https://github.com/Backspaces-devs/backspaces", label: "GitHub" },
  { Icon: FaInstagram, href: "https://www.instagram.com/bckspaces/", label: "Instagram" },
  { Icon: FaDiscord, href: "https://discord.gg/qQ5yvgB2N8", label: "Discord" },
  { Icon: FaTwitter, href: "https://x.com/Backspaces_devs", label: "Twitter" },
];

const defaultLegal = [
  { name: "Terms and Conditions", href: "/terms" },
  { name: "Privacy Policy", href: "/policy" },
];

export const PageFooter = ({
  logo = defaultLogo,
  sections = defaultSections,
  description = "A dev space built for students and developers eager to code.",
  socialLinks = defaultSocials,
  copyright = "© 2026 Backspaces. All rights reserved.",
  legalLinks = defaultLegal,
}: FooterProps) => {
  // If socialLinks is empty array (never[]), use defaults
  const socialsToShow = socialLinks && socialLinks.length > 0 ? socialLinks : defaultSocials;

  return (
    <footer className="w-full bg-[#0a0a0a] border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-14">
        <div className="flex flex-col lg:flex-row justify-between gap-10">
          <div className="flex flex-col gap-4 max-w-sm">
            <div className="flex items-center gap-2.5">
              <Link href={logo.url}>
                <img src={logo.src} alt={logo.alt} className="h-8 w-8 rounded-full border border-blue-500/50 object-cover" />
              </Link>
              <span className="text-[18px] font-semibold text-white">{logo.title}</span>
            </div>
            <p className="text-[13px] text-white/50 leading-relaxed">{description}</p>

            <div className="flex items-center gap-3 mt-3">
              {socialsToShow.map((s: any) => {
                const IconComp = s.Icon;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="size-9 flex items-center justify-center rounded-full bg-white text-black hover:bg-white/90 transition-colors"
                  >
                    {s.icon ? s.icon : IconComp ? <IconComp className="size-[18px]" /> : null}
                  </a>
                );
              })}
            </div>
          </div>

          <div className="flex gap-12 sm:gap-20">
            {sections.map((section) => (
              <div key={section.title}>
                <h4 className="text-sm font-semibold text-white mb-4">{section.title}</h4>
                <ul className="space-y-2.5 text-[13px] text-white/50">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link href={link.href} className="hover:text-white">{link.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px bg-white/[0.06] mt-12 mb-6" />
        <div className="flex flex-col sm:flex-row justify-between gap-3 text-[12px] text-white/40">
          <p>{copyright}</p>
          <div className="flex gap-4">
            {legalLinks.map((l) => (
              <Link key={l.name} href={l.href} className="hover:text-white/70">{l.name}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PageFooter;
