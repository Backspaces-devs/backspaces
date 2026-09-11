import { Navbar } from "@/components/ui/Navbar";
import { PageFooter } from "@/components/ui/PageFooter";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="mt-15">
        <Navbar />
      </div>
      {children}
      <PageFooter
        logo={{
          url: "/",
          src: "/logo.svg",
          alt: "Backspaces logo",
          title: "Backspaces",
        }}
        description="A dev space built for students and developers eager to code."
        sections={[
          {
            title: "Explore",
            links: [
              { name: "About", href: "/about" },
              { name: "Discover", href: "/discover" },
              { name: "Home", href: "/" },
            ],
          },
          {
            title: "Company",
            links: [
              { name: "Careers", href: "#" },
              { name: "Contact", href: "#" },
            ],
          },
          {
            title: "Resources",
            links: [
              { name: "Help", href: "#" },
              { name: "Privacy", href: "#" },
            ],
          },
        ]}
        socialLinks={[
          // adjust hrefs to your real socials once you have them
        ]}
        copyright="© 2026 Backspaces. All rights reserved."
      />
    </>
  );
}