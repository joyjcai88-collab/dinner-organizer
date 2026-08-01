import Link from "next/link";
import type { Metadata } from "next";
import Wordmark from "@/components/Wordmark";

export const metadata: Metadata = {
  title: "Privacy · Be My Guest",
  description:
    "What Be My Guest stores, what leaves your browser, and how to delete it.",
};

const UPDATED = "1 August 2026";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-line pt-7 mt-10 first:border-t-0 first:pt-0 first:mt-0">
      <h2 className="font-serif font-normal text-[22px] tracking-[-0.02em] text-text">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-[15px] leading-[1.55] text-secondary">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <header className="border-b border-line">
        <div className="max-w-3xl mx-auto px-6 py-7">
          <Wordmark href="/" />
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted mb-7">
            Privacy · Updated {UPDATED}
          </p>
          <h1 className="font-serif font-normal text-[32px] md:text-[44px] leading-[1.1] tracking-[-0.025em] text-text">
            What this app stores.
          </h1>
          <p className="mt-7 text-[15px] leading-[1.55] text-secondary">
            Be My Guest keeps your guest list, your tables and your notes in
            your own browser. There is no account, and there is no copy of that
            data on any server run by this app. The sections below describe
            exactly what is held, the few moments something leaves your browser,
            and how to remove it.
          </p>

          <div className="mt-14">
            <Section title="Where your data lives">
              <p>
                Guests, tables, seating, introductions and every note you write
                are stored in your browser using localStorage. They are not
                uploaded, not backed up automatically, and not visible to
                anyone operating this site.
              </p>
              <p>
                Because the storage is per browser, your data does not follow
                you between devices or browser profiles, and clearing your
                browsing data deletes it permanently. Use Back up in the app to
                write a copy to a file you control, and Restore to load it
                somewhere else.
              </p>
            </Section>

            <Section title="When something leaves your browser">
              <p>
                <strong className="text-text font-normal">
                  Importing a Luma guest list.
                </strong>{" "}
                Luma blocks browsers from calling its API directly, so the
                request passes through this site and on to Luma with the API
                key you supplied. The key is used for that request and is not
                stored on the server. It stays in your browser between visits so
                you do not have to paste it again.
              </p>
              <p>
                <strong className="text-text font-normal">
                  Signing in with LinkedIn.
                </strong>{" "}
                If you use it, LinkedIn returns your name, email and profile
                picture. That is kept in a cookie in your browser for a day and
                is not stored on the server.
              </p>
              <p>
                <strong className="text-text font-normal">
                  Profile lookup.
                </strong>{" "}
                When enabled, a profile address you paste is sent to this site,
                which fetches that public page and returns what it finds. It is
                turned off by default.
              </p>
              <p>
                <strong className="text-text font-normal">Hosting.</strong> The
                site is hosted on Vercel, which records ordinary request logs
                such as IP address, timestamp and page requested. That is a
                function of hosting rather than something this app collects.
              </p>
            </Section>

            <Section title="Invitation emails">
              <p>
                This app never sends email. When you invite a table, it composes
                the message and hands it to whatever email application you
                already use. Your guests&apos; addresses go from your browser
                straight to that application. They are never transmitted to this
                site, and no email service is involved on our side.
              </p>
              <p>
                Invitations place recipients in bcc, so guests do not see each
                other&apos;s addresses.
              </p>
            </Section>

            <Section title="Information about other people">
              <p>
                Most of what you keep here describes other people: where they
                work, when you last saw them, and whatever you choose to write
                in a note. Those notes often include things like dietary
                requirements or an allergy, which is sensitive information about
                someone who is not using this app and has not agreed to
                anything.
              </p>
              <p>
                You decide what to record, so you are responsible for it. Keep
                notes to what you genuinely need in order to host well, and
                delete a guest once you no longer need to. If someone asks what
                you hold about them, or asks you to remove it, you can find them
                in the Guests tab, export the list, or delete their record
                outright.
              </p>
            </Section>

            <Section title="Cookies and tracking">
              <p>
                There is no analytics, no advertising and no third-party
                tracking. The only cookies are the two used by LinkedIn sign-in
                if you choose to use it: a short-lived value that protects the
                sign-in exchange, and one holding your own profile for a day.
              </p>
            </Section>

            <Section title="Deleting everything">
              <p>
                Start fresh in the app empties every guest, table and
                introduction in that browser immediately. Clearing site data
                through your browser settings removes the same information along
                with the stored Luma key and any sign-in cookie. Neither
                requires asking anyone, because there is nothing held elsewhere
                to delete.
              </p>
            </Section>

            <Section title="Changes and contact">
              <p>
                If this policy changes, the date at the top of the page changes
                with it. Questions can go to{" "}
                <a
                  href="https://joyjcai.com"
                  className="underline hover:text-text transition-colors"
                >
                  joyjcai.com
                </a>
                .
              </p>
            </Section>
          </div>

          <div className="border-t border-line mt-12 pt-7">
            <Link
              href="/"
              className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted hover:text-text transition-colors"
            >
              Back to Be My Guest
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
