import Link from "next/link";
import Wordmark from "@/components/Wordmark";

const FEATURES = [
  {
    title: "Set the table",
    body: "Pull the guest list straight from your Luma event, or paste a CSV. Be My Guest proposes a seating chart that pairs complementary roles, keeps competitors apart, and steers away from pairs who have already shared a table.",
  },
  {
    title: "Keep the thread",
    body: "Log the introductions you make. Track what came of them. Find out that six dinners produced two hires and a seed check.",
  },
  {
    title: "Don't lose people",
    body: "See who's gone quiet. Sorted by how much the relationship is worth, not by when you last scrolled past them.",
  },
  {
    title: "Remember the details",
    body: "Priya's vegetarian. Marcus always arrives twenty minutes late. Be My Guest remembers so you don't have to ask twice.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <header className="border-b border-line">
        <div className="max-w-4xl mx-auto px-6 py-7">
          <Wordmark />
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-line">
        <div className="max-w-4xl mx-auto px-6 pt-16 pb-16 md:pt-24 md:pb-20">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted mb-7">
            Be My Guest
          </p>
          <h1 className="font-serif font-normal text-[32px] md:text-[44px] leading-[1.1] tracking-[-0.025em] text-text">
            Be My Dinner Guest.
          </h1>
          <p className="mt-7 text-[15px] leading-[1.55] text-secondary max-w-2xl">
            You&apos;ve thrown thirty dinners. You remember maybe four of them
            clearly.
          </p>
          <p className="mt-4 text-[15px] leading-[1.55] text-secondary max-w-2xl">
            Be My Guest keeps the part that compounds: who sat where, who hit it
            off, which introductions turned into a hire or a check, and who you
            haven&apos;t seen since last spring. Import your contacts once.
            Every table after that makes the next one better.
          </p>
          <div className="mt-10 flex items-center gap-5 flex-wrap">
            <Link
              href="/app?demo=1"
              className="rounded-full px-6 py-[11px] bg-ink text-paper font-mono text-[10.5px] uppercase tracking-[0.08em] hover:opacity-[0.82] transition-opacity"
            >
              See a real table →
            </Link>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
              Free · Your data stays in your browser
            </span>
          </div>
        </div>
      </section>

      {/* Features */}
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-6 py-16 md:py-20 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
          {FEATURES.map((f) => (
            <div key={f.title}>
              <h2 className="font-serif font-normal text-[22px] tracking-[-0.02em] text-text">
                {f.title}
              </h2>
              <p className="mt-3 text-[15px] leading-[1.55] text-secondary">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-line">
        <div className="max-w-4xl mx-auto px-6 py-8 flex items-center justify-between flex-wrap gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
            Be My Guest accumulates the relationships. thread runs the night.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted hover:text-text transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/app"
              className="font-mono text-[10px] uppercase tracking-[0.08em] text-secondary hover:text-accent transition-colors"
            >
              Open the app →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
