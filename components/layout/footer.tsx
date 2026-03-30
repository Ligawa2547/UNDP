import Link from "next/link"
import { Facebook, Twitter, Instagram, Linkedin, Youtube } from "lucide-react"

const footerLinks = {
  about: [
    { name: "Who We Are", href: "/about" },
    { name: "Our Leadership", href: "/about#leadership" },
    { name: "Our History", href: "/about#history" },
    { name: "Careers", href: "/careers" },
  ],
  work: [
    { name: "Sustainable Development", href: "/what-we-do" },
    { name: "Climate Action", href: "/issues/climate" },
    { name: "Gender Equality", href: "/issues/gender" },
    { name: "Governance", href: "/issues/governance" },
  ],
  resources: [
    { name: "Publications", href: "/resources" },
    { name: "Data Portal", href: "/resources#data" },
    { name: "Annual Reports", href: "/resources#reports" },
    { name: "Press Room", href: "/news" },
  ],
  countries: [
    { name: "Africa", href: "/countries?region=africa" },
    { name: "Arab States", href: "/countries?region=arab" },
    { name: "Asia & Pacific", href: "/countries?region=asia" },
    { name: "Europe & CIS", href: "/countries?region=europe" },
    { name: "Latin America", href: "/countries?region=latam" },
  ],
}

const socialLinks = [
  { name: "Facebook", href: "https://facebook.com/undp", icon: Facebook },
  { name: "Twitter", href: "https://twitter.com/undp", icon: Twitter },
  { name: "Instagram", href: "https://instagram.com/undp", icon: Instagram },
  { name: "LinkedIn", href: "https://linkedin.com/company/undp", icon: Linkedin },
  { name: "YouTube", href: "https://youtube.com/undp", icon: Youtube },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-[#0468B1] text-white">
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Logo and Description */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block">
              <img 
                src="/images/unedp-logo.jpg" 
                alt="UN Economic Development Programme Logo" 
                className="h-16 w-auto rounded bg-white p-2"
              />
            </Link>
            <p className="mt-4 text-sm text-white/80">
              UN Economic Development Programme
            </p>
            <p className="mt-2 text-xs text-white/60">
              Promoting sustainable economic development worldwide
            </p>
          </div>

          {/* About Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">About</h3>
            <ul className="space-y-2">
              {footerLinks.about.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-white/80 transition-colors hover:text-white">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Our Work Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Our Work</h3>
            <ul className="space-y-2">
              {footerLinks.work.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-white/80 transition-colors hover:text-white">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-white/80 transition-colors hover:text-white">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Countries Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Countries</h3>
            <ul className="space-y-2">
              {footerLinks.countries.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-white/80 transition-colors hover:text-white">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social Links */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/20 pt-8">
          <div className="flex gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20"
                aria-label={social.name}
              >
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-white/80">
            <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white">Terms of Use</Link>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-white/60">
          <p>© {new Date().getFullYear()} UN Economic Development Programme (UNEDP)</p>
        </div>
      </div>
    </footer>
  )
}
