import type { Metadata } from "next";

import { LegalList, LegalPage, LegalSection, LegalTodo } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms for using Eat That Frog.",
  alternates: { canonical: "/terms" },
};

const UPDATED = "22 August 2026";

export default function TermsPage() {
  return (
    <LegalPage title="Terms" updated={UPDATED}>
      <LegalSection heading="What this is">
        <p>
          Eat That Frog is a personal discipline journal, provided as-is, with no warranty and no
          guarantee of uptime or data durability. Keep your own copy of anything you cannot afford
          to lose.
        </p>
      </LegalSection>

      <LegalSection heading="Your account">
        <LegalList
          items={[
            "You are responsible for keeping your password to yourself.",
            "One account per person.",
            "You can delete your account at any time, and doing so deletes your journal with it.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="Acceptable use">
        <p>
          Do not attack the service, and do not attempt to reach anyone else&apos;s data. Accounts
          that do either can be suspended without notice.
        </p>
      </LegalSection>

      <LegalSection heading="Your content is yours">
        <p>
          What you write stays yours. No licence is claimed over it beyond storing it and showing it
          back to you, which is the only thing the app does with it.
        </p>
      </LegalSection>

      <LegalSection heading="Not advice">
        <p>
          This is a journal. It is not medical, psychological, or legal advice, and the private
          commitment feature is a self-tracking tool rather than a treatment for anything. If a
          behaviour is causing you real harm, please talk to someone qualified.
        </p>
      </LegalSection>

      <LegalSection heading="Changes">
        <p>
          These terms can change. The date at the top is the only claim made about when they last
          did.
        </p>
      </LegalSection>

      <LegalSection heading="Contact and governing law">
        <p>
          Governed by the laws of <LegalTodo>[add a jurisdiction]</LegalTodo>. Questions to{" "}
          <LegalTodo>[add a contact address]</LegalTodo>.
        </p>
      </LegalSection>

      <LegalSection heading="Honesty">
        <p>
          This is a personal project and this page has not been reviewed by a lawyer. It is a
          plain-language description of how the software actually behaves, not a substitute for real
          legal terms — which this project would need before taking payment or handling anyone
          else&apos;s data commercially.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
