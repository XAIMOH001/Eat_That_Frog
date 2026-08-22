import type { Metadata } from "next";

import { LegalList, LegalMail, LegalPage, LegalSection } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What Eat That Frog stores, why, and who else can see it.",
  alternates: { canonical: "/privacy" },
};

const UPDATED = "22 August 2026";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy" updated={UPDATED}>
      <LegalSection heading="The short version">
        <p>
          This app stores your email, a hashed password, and the journal you write. Nothing is sold,
          shared, or sent to a third party, because the app does not talk to any third party at all.
        </p>
      </LegalSection>

      <LegalSection heading="What is stored">
        <LegalList
          items={[
            "Your email address, and your display name if you set one.",
            "A hash of your password — never the password itself.",
            "Your journal: planned tasks, hourly notes, hour categories, and the core-routine flag for each day.",
            "Your private commitment, if you start one: the behaviour you chose is encrypted before it is written, and your daily check-ins are stored as dates only.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="Why it is stored">
        <p>
          To show you your own journal, and to work out your streaks and scores from it. That is the
          only purpose. There is no secondary use.
        </p>
      </LegalSection>

      <LegalSection heading="Who else sees it">
        <p>
          Nobody. There are no analytics, no advertising, no third-party trackers, and no embedded
          scripts from anyone else. The app&apos;s content security policy only permits requests to
          its own origin, so there is nowhere for your data to go even accidentally.
        </p>
      </LegalSection>

      <LegalSection heading="Your private commitment">
        <LegalList
          items={[
            "The behaviour you choose is never shown on your dashboard, on a public profile, on a leaderboard, or to an accountability group.",
            "It never appears in a URL, a page title, or a notification.",
            "It is encrypted in the database, so a database backup does not reveal it.",
            "It is shared only if you explicitly choose to share it.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="Cookies">
        <p>
          One cookie, holding your session so you stay signed in. There are no tracking or
          advertising cookies.
        </p>
      </LegalSection>

      <LegalSection heading="Keeping and deleting your data">
        <p>
          Your data stays until you delete it. Deleting your account deletes everything attached to
          it — journal, tasks, hourly logs, and commitment history — in the same operation. To
          request deletion, contact <LegalMail />.
        </p>
      </LegalSection>

      <LegalSection heading="Security">
        <p>
          Passwords are hashed. Every read and every write is scoped to your own account and
          re-checked on the server, not merely hidden in the interface.
        </p>
      </LegalSection>

      <LegalSection heading="Honesty">
        <p>
          This is a personal project, not a company. It has not been reviewed by a lawyer. If any of
          the above changes — a third-party service, payments, anything that moves your data off
          this server — this page changes first.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
