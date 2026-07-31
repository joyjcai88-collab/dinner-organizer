import Link from "next/link";

export const TOOL_NAME = "Be My Guest";

/**
 * Breadcrumb wordmark: play-mark + "Joy Cai / <Tool Name>".
 * "Joy Cai /" collapses below 560px, leaving just the tool name.
 */
export default function Wordmark({ href }: { href?: string }) {
  const name = href ? (
    <Link href={href} className="hover:text-secondary transition-colors">
      {TOOL_NAME}
    </Link>
  ) : (
    <span>{TOOL_NAME}</span>
  );

  return (
    <div className="flex items-center gap-3 text-text">
      <svg
        viewBox="0 0 26 26"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        width="22"
        height="22"
        aria-hidden="true"
        className="shrink-0"
      >
        <path d="M4 22 L4 4 L22 13 Z" />
        <path d="M8 18.5 L8 7.5 L18.5 13 Z" />
      </svg>
      <p className="font-serif text-[21px] leading-none">
        <span className="max-[560px]:hidden">
          <a
            href="https://joyjcai.com"
            className="hover:text-secondary transition-colors"
          >
            Joy Cai
          </a>
          <span className="text-muted px-1.5">/</span>
        </span>
        {name}
      </p>
    </div>
  );
}
