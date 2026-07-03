export const dynamic = "force-dynamic";

import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { searchPublic } from "@/server/polibrawl/services/public-delivery.service";
import { PublicNav, PublicFooter } from "@/components/public/layout";

export const metadata = {
  title: "Search | PoliBrawl",
  description: "Search platform policy red flags and survival guides across all covered platforms.",
  openGraph: {
    title: "Search | PoliBrawl",
    description: "Search platform policy red flags and survival guides across all covered platforms.",
    url: "https://polibrawl.com/search",
    siteName: "PoliBrawl",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Search | PoliBrawl",
    description: "Search platform policy red flags and survival guides across all covered platforms.",
  },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = (searchParams.q ?? "").trim();
  const results = query ? await searchPublic(query) : [];
  const platforms = results.filter((r) => r.type === "platform");
  const redFlags = results.filter((r) => r.type === "red_flag");

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicNav activePath="/search" />

      <main className="flex-1 py-10 mx-auto w-full max-w-4xl px-4 lg:px-6" id="main-content">
        <div className="space-y-8">
          {/* Search form */}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mb-5">Search</h1>
            <form
              method="get"
              action="/search"
              role="search"
              aria-label="Search platforms and red flags"
            >
              <div className="flex items-center gap-3 max-w-xl">
                <div className="relative flex-1">
                  <label htmlFor="search-input" className="sr-only">
                    Search platforms and red flags
                  </label>
                  <SearchIcon
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="search-input"
                    type="search"
                    name="q"
                    defaultValue={query}
                    placeholder="e.g. account termination, payout, PayPal..."
                    autoFocus={!query}
                    className="w-full rounded-md border border-slate-300 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
                >
                  Search
                </button>
              </div>
            </form>
          </div>

          {/* Results */}
          {query ? (
            <div className="space-y-8" aria-live="polite" role="region" aria-label="Search results">
              <p className="text-sm text-slate-500">
                {results.length === 0
                  ? `No results for "${query}".`
                  : `${results.length} result${results.length === 1 ? "" : "s"} for "${query}".`}
              </p>

              {results.length === 0 && (
                <div className="text-center py-20 bg-slate-50 border border-slate-200 rounded-lg">
                  <SearchIcon className="h-8 w-8 text-slate-300 mx-auto" aria-hidden="true" />
                  <p className="mt-4 text-sm text-slate-500">
                    Try a different search term, such as a platform name or policy keyword.
                  </p>
                  <Link
                    href="/platforms"
                    className="mt-4 inline-block text-sm text-blue-600 hover:underline"
                  >
                    Browse all platforms →
                  </Link>
                </div>
              )}

              {/* Platform results */}
              {platforms.length > 0 && (
                <section aria-labelledby="platform-results-heading">
                  <h2
                    id="platform-results-heading"
                    className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4"
                  >
                    Platforms ({platforms.length})
                  </h2>
                  <div className="grid gap-3">
                    {platforms.map((result) => (
                      <Link
                        key={result.id}
                        href={result.url}
                        className="group block outline-none"
                        aria-label={`View ${result.title} survival guide`}
                      >
                        <div className="bg-white border border-slate-200 rounded-lg p-4 transition-all hover:shadow-sm hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-slate-900">
                          <div className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors text-sm mb-1">
                            {result.title}
                          </div>
                          {result.summary && (
                            <p className="text-xs text-slate-500 line-clamp-2">{result.summary}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Red Flag results */}
              {redFlags.length > 0 && (
                <section aria-labelledby="redflag-results-heading">
                  <h2
                    id="redflag-results-heading"
                    className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4"
                  >
                    Policy Red Flags ({redFlags.length})
                  </h2>
                  <div className="grid gap-3">
                    {redFlags.map((result) => (
                      <Link
                        key={result.id}
                        href={result.url}
                        className="group block outline-none"
                        aria-label={`View red flag: ${result.title}`}
                      >
                        <div className="bg-white border border-slate-200 rounded-lg p-4 transition-all hover:shadow-sm hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-slate-900">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors text-sm">
                              {result.title}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mb-2">
                            via {result.platform_name}
                          </div>
                          {result.summary && (
                            <p className="text-xs text-slate-500 line-clamp-2">{result.summary}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            /* No query yet — show prompt */
            <div className="py-16 text-center">
              <SearchIcon className="h-8 w-8 text-slate-200 mx-auto" aria-hidden="true" />
              <p className="mt-4 text-sm text-slate-400">
                Enter a platform name or policy keyword to begin.
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Search covers platform names, policy categories, and red flag titles.
              </p>
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
