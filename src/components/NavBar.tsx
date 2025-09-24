"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 .5a11.5 11.5 0 00-3.64 22.42c.58.11.79-.25.79-.55v-1.94c-3.2.7-3.88-1.54-3.88-1.54-.53-1.36-1.3-1.72-1.3-1.72-1.06-.73.08-.72.08-.72 1.17.08 1.78 1.21 1.78 1.21 1.04 1.78 2.74 1.26 3.41.96.11-.76.41-1.26.75-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.07 0 0 .97-.31 3.18 1.19a11.1 11.1 0 015.8 0c2.2-1.5 3.17-1.19 3.17-1.19.63 1.6.23 2.78.11 3.07.74.81 1.18 1.84 1.18 3.1 0 4.41-2.69 5.39-5.26 5.67.42.37.8 1.1.8 2.22v3.29c0 .3.21.66.8.55A11.5 11.5 0 0012 .5z"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4.98 3.5a2.5 2.5 0 11-5.001.001A2.5 2.5 0 014.98 3.5zM.54 8.22h4.87V24H.54zM8.74 8.22h4.66v2.14h.07c.65-1.23 2.24-2.53 4.6-2.53 4.92 0 5.82 3.24 5.82 7.46V24h-4.87v-6.95c0-1.66-.03-3.8-2.31-3.8-2.32 0-2.68 1.81-2.68 3.68V24H8.74z"
      />
    </svg>
  );
}

export default function NavBar() {
  const locale = useLocale();
  const homeHref = locale ? `/${locale}` : "/";

  return (
    <nav className="bg-slate-950 border-b border-slate-800">
      <div className="w-full px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 text-slate-200">
          <Link
            href={homeHref}
            className="flex items-center gap-3"
            aria-label="Go to homepage"
          >
            <Image
              src="/logo.png"
              alt="Zarathucorp logo"
              width={36}
              height={36}
              className="h-9 w-9 drop-shadow"
            />
            <div className="leading-tight">
              <span className="block text-xs uppercase tracking-[0.35em] text-slate-400">
                Zarathucorp
              </span>
              <span className="block text-sm font-semibold text-white">
                SVG/EMF → PPTX Converter
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4 text-sm font-semibold text-slate-200">
            <a
              href="https://zarathu.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-2 hover:text-white transition-colors"
            >
              <span>Zarathu Corp.</span>
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 17L17 7"></path>
                <path d="M7 7h10v10"></path>
              </svg>
            </a>
            <a
              href="https://github.com/zarathucorp/ppt-converter"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center hover:text-white transition-colors px-2"
              aria-label="Zarathucorp GitHub"
            >
              <GitHubIcon />
            </a>
            <a
              href="https://www.linkedin.com/company/zarathu"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center hover:text-white transition-colors px-2"
              aria-label="Zarathucorp LinkedIn"
            >
              <LinkedInIcon />
            </a>
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
