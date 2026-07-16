import Link from "next/link";


const navLinks = [
  { href: "/platforms", label: "Directory" },
  { href: "/changes", label: "Radar" },
  { href: "/search", label: "Search" },
  { href: "/about", label: "About" },
  { href: "/dashboard", label: "Dashboard" },
] as const;

interface PublicNavProps {
  activePath?: string;
}

export function PublicNav({ activePath }: PublicNavProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-6">
        <Link href="/" aria-label="PoliBrawl home">
          <span className="text-lg font-semibold tracking-tight text-slate-900">PoliBrawl</span>
        </Link>
        <nav aria-label="Main navigation">
          <div className="flex items-center gap-6 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  activePath === link.href
                    ? "text-slate-900"
                    : "text-slate-500 hover:text-slate-900 transition-colors"
                }
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white py-10 mt-auto" role="contentinfo">
      <div className="mx-auto max-w-6xl px-4 lg:px-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} PoliBrawl. Editorial content only &mdash; not legal advice.
          </div>
          <nav aria-label="Footer navigation" className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/platforms" className="hover:text-slate-900 transition-colors">Directory</Link>
            <Link href="/changes" className="hover:text-slate-900 transition-colors">Radar</Link>
            <Link href="/search" className="hover:text-slate-900 transition-colors">Search</Link>
            <Link href="/about" className="hover:text-slate-900 transition-colors">About</Link>
            <Link href="/dashboard" className="hover:text-slate-900 transition-colors">Dashboard</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PublicBreadcrumbProps {
  items: BreadcrumbItem[];
}

export function PublicBreadcrumb({ items }: PublicBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-8">
      <ol className="flex items-center gap-2 text-sm text-slate-500" role="list">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true" className="text-slate-300">/</span>}
            {item.href ? (
              <Link href={item.href} className="hover:text-slate-900 transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-slate-900 font-medium" aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

interface RiskBadgeProps {
  level: string;
  className?: string;
}

const levelStyles: Record<string, string> = {
  critical: "text-red-700 bg-red-50 border-red-200",
  high: "text-orange-700 bg-orange-50 border-orange-200",
  medium: "text-yellow-700 bg-yellow-50 border-yellow-200",
  low: "text-green-700 bg-green-50 border-green-200",
};

export function RiskBadge({ level, className = "" }: RiskBadgeProps) {
  const style = levelStyles[level] ?? "text-slate-700 bg-slate-50 border-slate-200";
  return (
    <span
      className={`inline-flex items-center rounded border px-2.5 py-0.5 text-xs font-medium capitalize ${style} ${className}`}
    >
      {level} risk
    </span>
  );
}
