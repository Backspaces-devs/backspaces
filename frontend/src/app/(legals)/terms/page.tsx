// app/terms/page.jsx
//
// Drop this file into: app/terms/page.jsx (Next.js App Router)
// Requires Tailwind's dark mode set to "class" in tailwind.config.js:
//   module.exports = { darkMode: "class", ... }
//
// Matches the layout/format of the privacy-policy route: sticky sidebar
// table of contents, stone/neutral palette, light + dark mode support.

const COMPANY_NAME = "Backspaces";
const SITE_URL = "https://www.backspaces.com";
const CONTACT_EMAIL = "backspaces.devs@gmail.com";
const MAILING_ADDRESS_LINES = [
  "Ambedkar Nagar, Greater Noida",
  "Greater Noida, Uttar Pradesh 201310",
  "India",
];
const LAST_UPDATED = "September 10, 2026";

// ---- SEO metadata (Next.js App Router convention) ----
export const metadata = {
  title: `Terms and Conditions | ${COMPANY_NAME}`,
  description: `Read the Terms and Conditions for ${COMPANY_NAME}. Last updated ${LAST_UPDATED}.`,
  alternates: {
    canonical: `${SITE_URL}/terms`,
  },
  openGraph: {
    title: `Terms and Conditions | ${COMPANY_NAME}`,
    description: `Read the Terms and Conditions for ${COMPANY_NAME}.`,
    url: `${SITE_URL}/terms`,
    siteName: COMPANY_NAME,
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: `Terms and Conditions | ${COMPANY_NAME}`,
    description: `Read the Terms and Conditions for ${COMPANY_NAME}.`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

const sections = [
  { id: "services", label: "1. Our Services" },
  { id: "ip", label: "2. Intellectual Property Rights" },
  { id: "userreps", label: "3. User Representations" },
  { id: "userreg", label: "4. User Registration" },
  { id: "purchases", label: "5. Purchases and Payment" },
  { id: "prohibited", label: "6. Prohibited Activities" },
  { id: "ugc", label: "7. User Generated Contributions" },
  { id: "license", label: "8. Contribution License" },
  { id: "reviews", label: "9. Guidelines for Reviews" },
  { id: "socialmedia", label: "10. Social Media" },
  { id: "thirdparty", label: "11. Third-Party Websites and Content" },
  { id: "sitemanage", label: "12. Services Management" },
  { id: "ppyes", label: "13. Privacy Policy" },
  { id: "copyrightno", label: "14. Copyright Infringements" },
  { id: "terms", label: "15. Term and Termination" },
  { id: "modifications", label: "16. Modifications and Interruptions" },
  { id: "law", label: "17. Governing Law" },
  { id: "disputes", label: "18. Dispute Resolution" },
  { id: "corrections", label: "19. Corrections" },
  { id: "disclaimer", label: "20. Disclaimer" },
  { id: "liability", label: "21. Limitations of Liability" },
  { id: "indemnification", label: "22. Indemnification" },
  { id: "userdata", label: "23. User Data" },
  { id: "electronic", label: "24. Electronic Communications, Transactions, and Signatures" },
  { id: "sms", label: "25. SMS Text Messaging" },
  { id: "misc", label: "26. Miscellaneous" },
  { id: "contact", label: "27. Contact Us" },
];

function jsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Terms and Conditions | ${COMPANY_NAME}`,
    description: `${COMPANY_NAME}'s Terms and Conditions governing use of the Services.`,
    url: `${SITE_URL}/terms`,
    dateModified: LAST_UPDATED,
    publisher: {
      "@type": "Organization",
      name: COMPANY_NAME,
    },
  };
}

export default function TermsAndConditionsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }}
      />

      <div className="min-h-screen bg-stone-50 text-stone-800 dark:bg-neutral-950 dark:text-stone-200">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-14 md:grid-cols-[260px_1fr] md:px-10">
          {/* Sidebar / table of contents */}
          <nav
            aria-label="Table of contents"
            className="order-2 h-max md:sticky md:top-14 md:order-1"
          >
            <p className="mb-3 text-sm font-medium text-stone-500 dark:text-stone-400">
              On this page
            </p>
            <ul className="max-h-[75vh] space-y-2 overflow-y-auto border-l border-stone-200 pl-4 text-sm dark:border-neutral-800">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="text-stone-500 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-50"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Main content */}
          <main className="order-1 min-w-0 md:order-2">
            <header className="mb-10 border-b border-stone-200 pb-8 dark:border-neutral-800">
              <h1 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50 sm:text-4xl">
                Terms and Conditions
              </h1>
              <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
                Last updated: {LAST_UPDATED}
              </p>
            </header>

            <div className="max-w-none space-y-10 leading-relaxed">
              <section aria-labelledby="agreement-h">
                <h2 id="agreement-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  Agreement to our legal terms
                </h2>
                <div className="mt-4 space-y-4">
                  <p>
                    We are <span className="font-semibold">{COMPANY_NAME}</span>{" "}
                    (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo;
                    &ldquo;our&rdquo;), a company registered in India at{" "}
                    {MAILING_ADDRESS_LINES.join(", ")}.
                  </p>
                  <p>
                    We operate the website{" "}
                    <a
                      href={SITE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-words underline underline-offset-2"
                    >
                      {SITE_URL}
                    </a>{" "}
                    (the &ldquo;Site&rdquo;), as well as any other related
                    products and services that refer or link to these legal
                    terms (the &ldquo;Legal Terms&rdquo;) (collectively, the
                    &ldquo;Services&rdquo;).
                  </p>
                  <p>
                    You can contact us by email at{" "}
                    <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-2">
                      {CONTACT_EMAIL}
                    </a>{" "}
                    or by mail to {MAILING_ADDRESS_LINES.join(", ")}.
                  </p>
                  <p>
                    These Legal Terms constitute a legally binding agreement
                    made between you, whether personally or on behalf of an
                    entity (&ldquo;you&rdquo;), and{" "}
                    <span className="font-semibold">{COMPANY_NAME}</span>,
                    concerning your access to and use of the Services. You
                    agree that by accessing the Services, you have read,
                    understood, and agreed to be bound by all of these Legal
                    Terms.{" "}
                    <strong>
                      If you do not agree with all of these Legal Terms, then
                      you are expressly prohibited from using the Services and
                      you must discontinue use immediately.
                    </strong>
                  </p>
                  <p>
                    We will provide you with prior notice of any scheduled
                    changes to the Services you are using. The modified Legal
                    Terms will become effective upon posting or notifying you
                    by{" "}
                    <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-2">
                      {CONTACT_EMAIL}
                    </a>
                    , as stated in the email message. By continuing to use the
                    Services after the effective date of any changes, you
                    agree to be bound by the modified terms.
                  </p>
                  <p>
                    The Services are intended for users who are at least 18
                    years old. Persons under the age of 18 are not permitted
                    to use or register for the Services.
                  </p>
                  <p>
                    We recommend that you print a copy of these Legal Terms
                    for your records.
                  </p>
                </div>
              </section>

              <section id="services" className="scroll-mt-20" aria-labelledby="services-h">
                <h2 id="services-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  1. Our Services
                </h2>
                <p className="mt-3">
                  The information provided when using the Services is not
                  intended for distribution to or use by any person or entity
                  in any jurisdiction or country where such distribution or
                  use would be contrary to law or regulation, or which would
                  subject us to any registration requirement within such
                  jurisdiction or country. Accordingly, those who choose to
                  access the Services from other locations do so on their own
                  initiative and are solely responsible for compliance with
                  local laws, if and to the extent local laws are applicable.
                </p>
              </section>

              <section id="ip" className="scroll-mt-20" aria-labelledby="ip-h">
                <h2 id="ip-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  2. Intellectual property rights
                </h2>

                <h3 className="mt-6 text-base font-medium text-stone-900 dark:text-stone-100">
                  Our intellectual property
                </h3>
                <div className="mt-2 space-y-3">
                  <p>
                    We are the owner or the licensee of all intellectual
                    property rights in our Services, including all source
                    code, databases, functionality, software, website
                    designs, audio, video, text, photographs, and graphics in
                    the Services (collectively, the &ldquo;Content&rdquo;), as
                    well as the trademarks, service marks, and logos contained
                    therein (the &ldquo;Marks&rdquo;).
                  </p>
                  <p>
                    Our Content and Marks are protected by copyright and
                    trademark laws (and various other intellectual property
                    rights and unfair competition laws) and treaties around
                    the world.
                  </p>
                  <p>
                    The Content and Marks are provided in or through the
                    Services &ldquo;as is&rdquo; for your personal,
                    non-commercial use only.
                  </p>
                </div>

                <h3 className="mt-6 text-base font-medium text-stone-900 dark:text-stone-100">
                  Your use of our Services
                </h3>
                <div className="mt-2 space-y-3">
                  <p>
                    Subject to your compliance with these Legal Terms,
                    including the{" "}
                    <a href="#prohibited" className="underline underline-offset-2">
                      Prohibited Activities
                    </a>{" "}
                    section below, we grant you a non-exclusive,
                    non-transferable, revocable license to:
                  </p>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>access the Services; and</li>
                    <li>
                      download or print a copy of any portion of the Content
                      to which you have properly gained access,
                    </li>
                  </ul>
                  <p>solely for your personal, non-commercial use.</p>
                  <p>
                    Except as set out in this section or elsewhere in our
                    Legal Terms, no part of the Services and no Content or
                    Marks may be copied, reproduced, aggregated, republished,
                    uploaded, posted, publicly displayed, encoded, translated,
                    transmitted, distributed, sold, licensed, or otherwise
                    exploited for any commercial purpose whatsoever, without
                    our express prior written permission.
                  </p>
                  <p>
                    If you wish to make any use of the Services, Content, or
                    Marks other than as set out in this section, please
                    address your request to{" "}
                    <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-2">
                      {CONTACT_EMAIL}
                    </a>
                    . If we ever grant you permission to post, reproduce, or
                    publicly display any part of our Services or Content, you
                    must identify us as the owners or licensors of the
                    Services, Content, or Marks and ensure that any copyright
                    or proprietary notice appears or is visible on posting,
                    reproducing, or displaying our Content.
                  </p>
                  <p>
                    We reserve all rights not expressly granted to you in and
                    to the Services, Content, and Marks.
                  </p>
                  <p>
                    Any breach of these Intellectual Property Rights will
                    constitute a material breach of our Legal Terms and your
                    right to use our Services will terminate immediately.
                  </p>
                </div>

                <h3 className="mt-6 text-base font-medium text-stone-900 dark:text-stone-100">
                  Your submissions and contributions
                </h3>
                <div className="mt-2 space-y-3">
                  <p>
                    Please review this section and the{" "}
                    <a href="#prohibited" className="underline underline-offset-2">
                      Prohibited Activities
                    </a>{" "}
                    section carefully prior to using our Services to
                    understand (a) the rights you give us and (b) the
                    obligations you have when you post or upload content
                    through the Services.
                  </p>
                  <p>
                    <strong>Submissions:</strong> By directly sending us any
                    question, comment, suggestion, idea, feedback, or other
                    information about the Services (&ldquo;Submissions&rdquo;),
                    you agree to assign to us all intellectual property rights
                    in such Submission. You agree that we shall own this
                    Submission and be entitled to its unrestricted use and
                    dissemination for any lawful purpose, commercial or
                    otherwise, without acknowledgment or compensation to you.
                  </p>
                  <p>
                    <strong>Contributions:</strong> The Services may invite
                    you to chat, contribute to, or participate in blogs,
                    message boards, online forums, and other functionality
                    during which you may create, submit, post, display,
                    transmit, publish, distribute, or broadcast content and
                    materials to us or through the Services (&ldquo;Contributions&rdquo;).
                    Any Submission that is publicly posted shall also be
                    treated as a Contribution.
                  </p>
                  <p>
                    You understand that Contributions may be viewable by other
                    users of the Services and possibly through third-party
                    websites.
                  </p>
                  <p>
                    <strong>
                      When you post Contributions, you grant us a license
                      (including use of your name, trademarks, and logos):
                    </strong>{" "}
                    by posting any Contributions, you grant us an
                    unrestricted, unlimited, irrevocable, perpetual,
                    non-exclusive, transferable, royalty-free, fully-paid,
                    worldwide right and license to use, copy, reproduce,
                    distribute, sell, resell, publish, broadcast, retitle,
                    store, publicly perform, publicly display, reformat,
                    translate, excerpt, and exploit your Contributions
                    (including your image, name, and voice) for any purpose,
                    commercial, advertising, or otherwise, to prepare
                    derivative works of, or incorporate into other works, your
                    Contributions, and to sublicense the licenses granted in
                    this section. Our use and distribution may occur in any
                    media formats and through any media channels.
                  </p>
                  <p>
                    This license includes our use of your name, company name,
                    and franchise name, as applicable, and any trademarks,
                    service marks, trade names, logos, and personal and
                    commercial images you provide.
                  </p>
                  <p>
                    <strong>You are responsible for what you post or upload:</strong>{" "}
                    by sending us Submissions and/or posting Contributions
                    through the Services, you:
                  </p>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>
                      confirm that you have read and agree with our{" "}
                      <a href="#prohibited" className="underline underline-offset-2">
                        Prohibited Activities
                      </a>{" "}
                      and will not post any Submission or Contribution that is
                      illegal, harassing, hateful, harmful, defamatory,
                      obscene, bullying, abusive, discriminatory, threatening
                      to any person or group, sexually explicit, false,
                      inaccurate, deceitful, or misleading;
                    </li>
                    <li>
                      to the extent permissible by applicable law, waive any
                      and all moral rights to any such Submission and/or
                      Contribution;
                    </li>
                    <li>
                      warrant that any such Submission and/or Contributions
                      are original to you or that you have the necessary
                      rights and licenses to submit them, and that you have
                      full authority to grant us the rights described above;
                      and
                    </li>
                    <li>
                      warrant and represent that your Submissions and/or
                      Contributions do not constitute confidential
                      information.
                    </li>
                  </ul>
                  <p>
                    You are solely responsible for your Submissions and/or
                    Contributions and expressly agree to reimburse us for any
                    losses we may suffer because of your breach of (a) this
                    section, (b) any third party&rsquo;s intellectual property
                    rights, or (c) applicable law.
                  </p>
                  <p>
                    <strong>We may remove or edit your Content:</strong>{" "}
                    although we have no obligation to monitor Contributions,
                    we may remove or edit any Contributions at any time
                    without notice if, in our reasonable opinion, we consider
                    them harmful or in breach of these Legal Terms. We may
                    also suspend or disable your account and report you to
                    the authorities.
                  </p>
                </div>

                <h3 className="mt-6 text-base font-medium text-stone-900 dark:text-stone-100">
                  Copyright infringement
                </h3>
                <p className="mt-2">
                  We respect the intellectual property rights of others. If
                  you believe that any material available on or through the
                  Services infringes upon any copyright you own or control,
                  please immediately refer to the{" "}
                  <a href="#copyrightno" className="underline underline-offset-2">
                    Copyright Infringements
                  </a>{" "}
                  section below.
                </p>
              </section>

              <section id="userreps" className="scroll-mt-20" aria-labelledby="userreps-h">
                <h2 id="userreps-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  3. User representations
                </h2>
                <div className="mt-3 space-y-3">
                  <p>
                    By using the Services, you represent and warrant that:
                    (1) all registration information you submit will be true,
                    accurate, current, and complete; (2) you will maintain the
                    accuracy of such information and promptly update it as
                    necessary; (3) you have the legal capacity and agree to
                    comply with these Legal Terms; (4) you are not a minor in
                    the jurisdiction in which you reside; (5) you will not
                    access the Services through automated or non-human means,
                    whether through a bot, script, or otherwise; (6) you will
                    not use the Services for any illegal or unauthorized
                    purpose; and (7) your use of the Services will not violate
                    any applicable law or regulation.
                  </p>
                  <p>
                    If you provide any information that is untrue, inaccurate,
                    not current, or incomplete, we have the right to suspend
                    or terminate your account and refuse any current or
                    future use of the Services.
                  </p>
                </div>
              </section>

              <section id="userreg" className="scroll-mt-20" aria-labelledby="userreg-h">
                <h2 id="userreg-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  4. User registration
                </h2>
                <p className="mt-3">
                  You may be required to register to use the Services. You
                  agree to keep your password confidential and will be
                  responsible for all use of your account and password. We
                  reserve the right to remove, reclaim, or change a username
                  you select if we determine, in our sole discretion, that
                  such username is inappropriate, obscene, or otherwise
                  objectionable.
                </p>
              </section>

              <section id="purchases" className="scroll-mt-20" aria-labelledby="purchases-h">
                <h2 id="purchases-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  5. Purchases and payment
                </h2>
                <div className="mt-3 space-y-3">
                  <p>We accept the following forms of payment:</p>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>Visa</li>
                    <li>Mastercard</li>
                  </ul>
                  <p>
                    You agree to provide current, complete, and accurate
                    purchase and account information for all purchases made
                    via the Services, and to promptly update your account and
                    payment information as needed. Sales tax will be added to
                    the price of purchases as deemed required by us. We may
                    change prices at any time. All payments shall be in INR.
                  </p>
                  <p>
                    You agree to pay all charges at the prices then in effect
                    for your purchases and any applicable shipping fees, and
                    you authorize us to charge your chosen payment provider
                    for any such amounts upon placing your order. We reserve
                    the right to correct any errors or mistakes in pricing,
                    even if we have already requested or received payment.
                  </p>
                  <p>
                    We reserve the right to refuse any order placed through
                    the Services, and may limit or cancel quantities purchased
                    per person, household, or order, including orders that
                    use the same account, payment method, or billing/shipping
                    address. We reserve the right to limit or prohibit orders
                    that, in our sole judgment, appear to be placed by
                    dealers, resellers, or distributors.
                  </p>
                </div>
              </section>

              <section id="prohibited" className="scroll-mt-20" aria-labelledby="prohibited-h">
                <h2 id="prohibited-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  6. Prohibited activities
                </h2>
                <div className="mt-3 space-y-3">
                  <p>
                    You may not access or use the Services for any purpose
                    other than that for which we make them available. The
                    Services may not be used in connection with any
                    commercial endeavors except those specifically endorsed
                    or approved by us.
                  </p>
                  <p>As a user of the Services, you agree not to:</p>
                  <ul className="list-disc space-y-1.5 pl-6">
                    <li>
                      Systematically retrieve data or other content from the
                      Services to create or compile a collection, database, or
                      directory without written permission from us.
                    </li>
                    <li>
                      Trick, defraud, or mislead us and other users,
                      especially in an attempt to learn sensitive account
                      information such as passwords.
                    </li>
                    <li>
                      Circumvent, disable, or otherwise interfere with
                      security-related features of the Services.
                    </li>
                    <li>
                      Disparage, tarnish, or otherwise harm, in our opinion,
                      us and/or the Services.
                    </li>
                    <li>
                      Use any information obtained from the Services to
                      harass, abuse, or harm another person.
                    </li>
                    <li>
                      Make improper use of our support services or submit
                      false reports of abuse or misconduct.
                    </li>
                    <li>
                      Use the Services in a manner inconsistent with any
                      applicable laws or regulations.
                    </li>
                    <li>Engage in unauthorized framing of or linking to the Services.</li>
                    <li>
                      Upload or transmit viruses, Trojan horses, or other
                      material, including excessive use of capital letters and
                      spamming, that interferes with any party&rsquo;s
                      uninterrupted use of the Services.
                    </li>
                    <li>
                      Engage in any automated use of the system, such as using
                      scripts to send comments or messages, or using data
                      mining, robots, or similar data gathering tools.
                    </li>
                    <li>Delete the copyright or other proprietary rights notice from any Content.</li>
                    <li>Attempt to impersonate another user or person or use the username of another user.</li>
                    <li>
                      Upload or transmit any material that acts as a passive
                      or active information collection or transmission
                      mechanism, such as web bugs, cookies, or similar
                      devices.
                    </li>
                    <li>Interfere with, disrupt, or create an undue burden on the Services or connected networks.</li>
                    <li>Harass, annoy, intimidate, or threaten any of our employees or agents.</li>
                    <li>Attempt to bypass any measures designed to prevent or restrict access to the Services.</li>
                    <li>Copy or adapt the Services&rsquo; software, including HTML, JavaScript, or other code.</li>
                    <li>
                      Except as permitted by applicable law, decipher,
                      decompile, disassemble, or reverse engineer any software
                      comprising the Services.
                    </li>
                    <li>
                      Use, launch, develop, or distribute any automated
                      system, including any spider, robot, scraper, or offline
                      reader that accesses the Services.
                    </li>
                    <li>Use a buying or purchasing agent to make purchases on the Services.</li>
                    <li>
                      Make any unauthorized use of the Services, including
                      collecting usernames and/or emails for unsolicited
                      email, or creating accounts by automated means or false
                      pretenses.
                    </li>
                    <li>
                      Use the Services to compete with us or for any
                      revenue-generating endeavor or commercial enterprise
                      not endorsed by us.
                    </li>
                    <li>Use the Services to advertise or offer to sell goods and services.</li>
                  </ul>
                </div>
              </section>

              <section id="ugc" className="scroll-mt-20" aria-labelledby="ugc-h">
                <h2 id="ugc-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  7. User generated contributions
                </h2>
                <div className="mt-3 space-y-3">
                  <p>
                    The Services may invite you to chat, contribute to, or
                    participate in blogs, message boards, online forums, and
                    other functionality, and provide you the opportunity to
                    create, submit, post, display, transmit, perform,
                    publish, distribute, or broadcast content and materials
                    (&ldquo;Contributions&rdquo;). Contributions may be
                    viewable by other users and through third-party websites,
                    and may be treated as non-confidential and
                    non-proprietary. When you create or make available any
                    Contributions, you represent and warrant that:
                  </p>
                  <ul className="list-disc space-y-1.5 pl-6">
                    <li>
                      The creation, distribution, transmission, public
                      display, or performance, and the accessing, downloading,
                      or copying of your Contributions do not and will not
                      infringe the proprietary rights of any third party.
                    </li>
                    <li>
                      You are the creator and owner of, or have the necessary
                      licenses and rights to use and authorize us and other
                      users to use, your Contributions.
                    </li>
                    <li>
                      You have the consent of every identifiable person in
                      your Contributions to use their name or likeness as
                      contemplated by the Services and these Legal Terms.
                    </li>
                    <li>Your Contributions are not false, inaccurate, or misleading.</li>
                    <li>
                      Your Contributions are not unsolicited or unauthorized
                      advertising, promotional material, pyramid schemes,
                      chain letters, spam, or mass mailings.
                    </li>
                    <li>
                      Your Contributions are not obscene, lewd, violent,
                      harassing, libelous, or otherwise objectionable (as
                      determined by us).
                    </li>
                    <li>Your Contributions do not ridicule, mock, disparage, intimidate, or abuse anyone.</li>
                    <li>
                      Your Contributions are not used to harass or threaten
                      any person or to promote violence against a person or
                      class of people.
                    </li>
                    <li>Your Contributions do not violate any applicable law, regulation, or rule.</li>
                    <li>Your Contributions do not violate the privacy or publicity rights of any third party.</li>
                    <li>
                      Your Contributions do not violate any law concerning
                      child pornography, or otherwise intended to protect the
                      health or well-being of minors.
                    </li>
                    <li>
                      Your Contributions do not include offensive comments
                      connected to race, national origin, gender, sexual
                      preference, or physical handicap.
                    </li>
                    <li>
                      Your Contributions do not otherwise violate, or link to
                      material that violates, any provision of these Legal
                      Terms or applicable law.
                    </li>
                  </ul>
                  <p>
                    Any use of the Services in violation of the foregoing
                    violates these Legal Terms and may result in termination
                    or suspension of your rights to use the Services.
                  </p>
                </div>
              </section>

              <section id="license" className="scroll-mt-20" aria-labelledby="license-h">
                <h2 id="license-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  8. Contribution license
                </h2>
                <div className="mt-3 space-y-3">
                  <p>
                    By posting your Contributions to any part of the Services,
                    you automatically grant us an unrestricted, unlimited,
                    irrevocable, perpetual, non-exclusive, transferable,
                    royalty-free, fully-paid, worldwide right and license to
                    host, use, copy, reproduce, disclose, sell, resell,
                    publish, broadcast, retitle, archive, store, cache,
                    publicly perform, publicly display, reformat, translate,
                    transmit, excerpt, and distribute such Contributions for
                    any purpose, and to prepare derivative works of, or
                    incorporate into other works, such Contributions.
                  </p>
                  <p>
                    This license will apply to any form, media, or technology
                    now known or hereafter developed, and includes our use of
                    your name, company name, and franchise name, as
                    applicable. You waive all moral rights in your
                    Contributions.
                  </p>
                  <p>
                    We do not assert any ownership over your Contributions.
                    You retain full ownership of all of your Contributions and
                    any associated intellectual property rights. We are not
                    liable for any statements or representations in your
                    Contributions.
                  </p>
                  <p>
                    We have the right, in our sole discretion, to (1) edit,
                    redact, or otherwise change any Contributions; (2)
                    re-categorize any Contributions; and (3) pre-screen or
                    delete any Contributions at any time and for any reason,
                    without notice.
                  </p>
                </div>
              </section>

              <section id="reviews" className="scroll-mt-20" aria-labelledby="reviews-h">
                <h2 id="reviews-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  9. Guidelines for reviews
                </h2>
                <div className="mt-3 space-y-3">
                  <p>
                    We may provide areas on the Services to leave reviews or
                    ratings. When posting a review, you must comply with the
                    following criteria: (1) you should have firsthand
                    experience with the person/entity being reviewed; (2)
                    your reviews should not contain offensive profanity or
                    abusive, racist, or hateful language; (3) your reviews
                    should not contain discriminatory references based on
                    religion, race, gender, national origin, age, marital
                    status, sexual orientation, or disability; (4) your
                    reviews should not reference illegal activity; (5) you
                    should not be affiliated with competitors if posting
                    negative reviews; (6) you should not draw conclusions as
                    to the legality of conduct; (7) you may not post false or
                    misleading statements; and (8) you may not organize a
                    campaign encouraging others to post reviews.
                  </p>
                  <p>
                    We may accept, reject, or remove reviews in our sole
                    discretion, and have no obligation to screen or delete
                    reviews. Reviews are not endorsed by us and do not
                    necessarily represent our opinions. By posting a review,
                    you grant us a perpetual, non-exclusive, worldwide,
                    royalty-free, fully paid, assignable, and sublicensable
                    right and license to reproduce, modify, translate,
                    transmit, display, perform, and/or distribute all content
                    relating to the review.
                  </p>
                </div>
              </section>

              <section id="socialmedia" className="scroll-mt-20" aria-labelledby="socialmedia-h">
                <h2 id="socialmedia-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  10. Social media
                </h2>
                <p className="mt-3">
                  As part of the functionality of the Services, you may link
                  your account with online accounts you have with third-party
                  service providers (each, a &ldquo;Third-Party Account&rdquo;).
                  You represent and warrant that you are entitled to disclose
                  your Third-Party Account login information to us, without
                  breaching any terms governing your use of that account. By
                  granting us access, you understand that we may access,
                  make available, and store content from your Third-Party
                  Account (&ldquo;Social Network Content&rdquo;) so it is
                  available through the Services, and may receive additional
                  information when you link your accounts. Your relationship
                  with third-party service providers is governed solely by
                  your agreement with them; we make no effort to review
                  Social Network Content and are not responsible for it. You
                  can disable the connection between your account and any
                  Third-Party Account at any time via account settings or by
                  contacting us, and we will attempt to delete stored
                  information obtained through that account, except your
                  username and profile picture.
                </p>
              </section>

              <section id="thirdparty" className="scroll-mt-20" aria-labelledby="thirdparty-h">
                <h2 id="thirdparty-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  11. Third-party websites and content
                </h2>
                <p className="mt-3">
                  The Services may contain links to other websites
                  (&ldquo;Third-Party Websites&rdquo;) as well as content
                  belonging to third parties (&ldquo;Third-Party
                  Content&rdquo;). Such Third-Party Websites and Content are
                  not investigated or checked for accuracy by us, and we are
                  not responsible for them. Inclusion of or linking to any
                  Third-Party Website or Content does not imply our
                  endorsement. If you access a Third-Party Website, you do so
                  at your own risk and these Legal Terms no longer govern. Any
                  purchases made through Third-Party Websites are solely
                  between you and that third party, and you agree to hold us
                  blameless from any harm or loss relating to such purchases
                  or Third-Party Content.
                </p>
              </section>

              <section id="sitemanage" className="scroll-mt-20" aria-labelledby="sitemanage-h">
                <h2 id="sitemanage-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  12. Services management
                </h2>
                <p className="mt-3">
                  We reserve the right, but not the obligation, to: (1)
                  monitor the Services for violations of these Legal Terms;
                  (2) take appropriate legal action against anyone who
                  violates the law or these Legal Terms; (3) refuse, restrict,
                  limit, or disable any of your Contributions; (4) remove or
                  disable files and content that are excessive in size or
                  burdensome to our systems; and (5) otherwise manage the
                  Services to protect our rights and property and facilitate
                  their proper functioning.
                </p>
              </section>

              <section id="ppyes" className="scroll-mt-20" aria-labelledby="ppyes-h">
                <h2 id="ppyes-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  13. Privacy policy
                </h2>
                <p className="mt-3">
                  We care about data privacy and security. Please review our{" "}
                  <a
                    href={`${SITE_URL}/privacy`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-words underline underline-offset-2"
                  >
                    Privacy Policy
                  </a>
                  . By using the Services, you agree to be bound by our
                  Privacy Policy, which is incorporated into these Legal
                  Terms. Please be advised the Services are hosted in India.
                  If you access the Services from any other region with laws
                  governing personal data that differ from India&rsquo;s, by
                  continuing to use the Services you consent to have your data
                  transferred to and processed in India.
                </p>
              </section>

              <section id="copyrightno" className="scroll-mt-20" aria-labelledby="copyrightno-h">
                <h2 id="copyrightno-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  14. Copyright infringements
                </h2>
                <p className="mt-3">
                  We respect the intellectual property rights of others. If
                  you believe that material available on or through the
                  Services infringes a copyright you own or control, please
                  immediately notify us using the contact information below
                  (a &ldquo;Notification&rdquo;). A copy of your Notification
                  will be sent to the person who posted or stored the
                  material. You may be held liable for damages if you make
                  material misrepresentations in a Notification, so if you
                  are unsure whether material infringes your copyright,
                  consider contacting an attorney first.
                </p>
              </section>

              <section id="terms" className="scroll-mt-20" aria-labelledby="terms-h">
                <h2 id="terms-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  15. Term and termination
                </h2>
                <div className="mt-3 space-y-3">
                  <p>
                    These Legal Terms remain in full force and effect while
                    you use the Services. Without limiting any other
                    provision, we reserve the right to, in our sole
                    discretion and without notice or liability, deny access
                    to and use of the Services to any person for any reason,
                    including breach of any representation, warranty, or
                    covenant in these Legal Terms or applicable law. We may
                    terminate your use or delete your account and any
                    content or information you posted at any time, without
                    warning, in our sole discretion.
                  </p>
                  <p>
                    If we terminate or suspend your account, you are
                    prohibited from registering a new account under your
                    name, a fake or borrowed name, or a third party&rsquo;s
                    name. We reserve the right to take appropriate legal
                    action, including civil, criminal, and injunctive
                    redress.
                  </p>
                </div>
              </section>

              <section id="modifications" className="scroll-mt-20" aria-labelledby="modifications-h">
                <h2 id="modifications-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  16. Modifications and interruptions
                </h2>
                <div className="mt-3 space-y-3">
                  <p>
                    We reserve the right to change, modify, or remove the
                    contents of the Services at any time or for any reason at
                    our sole discretion without notice. We have no obligation
                    to update information on our Services and will not be
                    liable for any modification, price change, suspension, or
                    discontinuance of the Services.
                  </p>
                  <p>
                    We cannot guarantee the Services will be available at all
                    times, and may experience hardware, software, or other
                    problems requiring maintenance, resulting in
                    interruptions, delays, or errors. We reserve the right to
                    change, suspend, discontinue, or modify the Services at
                    any time without notice, and have no liability for any
                    loss or damage caused by your inability to access the
                    Services during downtime.
                  </p>
                </div>
              </section>

              <section id="law" className="scroll-mt-20" aria-labelledby="law-h">
                <h2 id="law-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  17. Governing law
                </h2>
                <p className="mt-3">
                  These Legal Terms shall be governed by and defined
                  following the laws of India.{" "}
                  <span className="font-semibold">{COMPANY_NAME}</span> and
                  you irrevocably consent that the courts of India shall have
                  exclusive jurisdiction to resolve any dispute arising in
                  connection with these Legal Terms.
                </p>
              </section>

              <section id="disputes" className="scroll-mt-20" aria-labelledby="disputes-h">
                <h2 id="disputes-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  18. Dispute resolution
                </h2>

                <h3 className="mt-6 text-base font-medium text-stone-900 dark:text-stone-100">
                  Binding arbitration
                </h3>
                <p className="mt-2">
                  If the parties are unable to resolve a dispute through
                  informal negotiation, the dispute shall be finally resolved
                  by arbitration in accordance with the United Nations
                  Commission on International Trade Law Arbitration Rules in
                  force at the time of commencement of the arbitration. The
                  number of arbitrators shall be two (2). The seat of
                  arbitration shall be Greater Noida, India. The language of
                  the proceedings shall be English, and the governing law
                  shall be the substantive law of India.
                </p>

                <h3 className="mt-6 text-base font-medium text-stone-900 dark:text-stone-100">
                  Restrictions
                </h3>
                <p className="mt-2">
                  The Parties agree that any arbitration shall be limited to
                  the dispute between the Parties individually. To the full
                  extent permitted by law: (a) no arbitration shall be joined
                  with any other proceeding; (b) there is no right to
                  arbitrate on a class-action basis or utilize class-action
                  procedures; and (c) there is no right to bring a dispute in
                  a representative capacity on behalf of the general public
                  or other persons.
                </p>

                <h3 className="mt-6 text-base font-medium text-stone-900 dark:text-stone-100">
                  Exceptions to arbitration
                </h3>
                <p className="mt-2">
                  The Parties agree the following disputes are not subject to
                  binding arbitration: (a) disputes seeking to enforce or
                  protect, or concerning the validity of, intellectual
                  property rights; (b) disputes related to allegations of
                  theft, piracy, invasion of privacy, or unauthorized use; and
                  (c) any claim for injunctive relief. If this provision is
                  found illegal or unenforceable, the relevant dispute will be
                  decided by a court of competent jurisdiction as described
                  above, and the Parties agree to submit to that court&rsquo;s
                  personal jurisdiction.
                </p>
              </section>

              <section id="corrections" className="scroll-mt-20" aria-labelledby="corrections-h">
                <h2 id="corrections-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  19. Corrections
                </h2>
                <p className="mt-3">
                  There may be information on the Services that contains
                  typographical errors, inaccuracies, or omissions, including
                  descriptions, pricing, availability, and other information.
                  We reserve the right to correct any errors, inaccuracies, or
                  omissions and to change or update information on the
                  Services at any time, without prior notice.
                </p>
              </section>

              <section id="disclaimer" className="scroll-mt-20" aria-labelledby="disclaimer-h">
                <h2 id="disclaimer-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  20. Disclaimer
                </h2>
                <p className="mt-3 uppercase">
                  The Services are provided on an as-is and as-available
                  basis. Your use of the Services is at your sole risk. To
                  the fullest extent permitted by law, we disclaim all
                  warranties, express or implied, including the implied
                  warranties of merchantability, fitness for a particular
                  purpose, and non-infringement. We make no warranties about
                  the accuracy or completeness of the Services&rsquo; content
                  and assume no liability for (1) errors or inaccuracies of
                  content, (2) personal injury or property damage resulting
                  from your use of the Services, (3) unauthorized access to
                  our servers or any personal or financial information
                  stored therein, (4) any interruption of transmission to or
                  from the Services, (5) bugs or viruses transmitted through
                  the Services by any third party, and/or (6) errors or
                  omissions in content or any loss or damage incurred from use
                  of content made available via the Services. We do not
                  endorse or guarantee any product or service advertised by a
                  third party through the Services and are not responsible
                  for monitoring transactions between you and third-party
                  providers.
                </p>
              </section>

              <section id="liability" className="scroll-mt-20" aria-labelledby="liability-h">
                <h2 id="liability-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  21. Limitations of liability
                </h2>
                <p className="mt-3 uppercase">
                  In no event will we or our directors, employees, or agents
                  be liable to you or any third party for any direct,
                  indirect, consequential, exemplary, incidental, special, or
                  punitive damages, including lost profit, lost revenue, or
                  loss of data, arising from your use of the Services, even
                  if advised of the possibility of such damages. Our
                  liability to you for any cause, regardless of the form of
                  action, will at all times be limited to the amount paid, if
                  any, by you to us. Some jurisdictions do not allow
                  limitations on implied warranties or exclusion of certain
                  damages, so some of the above limitations may not apply to
                  you.
                </p>
              </section>

              <section id="indemnification" className="scroll-mt-20" aria-labelledby="indemnification-h">
                <h2 id="indemnification-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  22. Indemnification
                </h2>
                <p className="mt-3">
                  You agree to defend, indemnify, and hold us harmless,
                  including our subsidiaries, affiliates, and respective
                  officers, agents, partners, and employees, from any loss,
                  damage, liability, claim, or demand, including reasonable
                  attorneys&rsquo; fees, made by any third party due to or
                  arising out of: (1) your Contributions; (2) use of the
                  Services; (3) breach of these Legal Terms; (4) breach of
                  your representations and warranties; (5) your violation of
                  the rights of a third party; or (6) any harmful act toward
                  another user of the Services. We reserve the right, at your
                  expense, to assume exclusive defense and control of any
                  matter for which you are required to indemnify us, and you
                  agree to cooperate with our defense of such claims.
                </p>
              </section>

              <section id="userdata" className="scroll-mt-20" aria-labelledby="userdata-h">
                <h2 id="userdata-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  23. User data
                </h2>
                <p className="mt-3">
                  We will maintain certain data that you transmit to the
                  Services for the purpose of managing performance, as well
                  as data relating to your use of the Services. Although we
                  perform regular routine backups, you are solely responsible
                  for all data you transmit or that relates to activity you
                  undertake using the Services. We have no liability to you
                  for any loss or corruption of such data, and you waive any
                  right of action against us arising from such loss.
                </p>
              </section>

              <section id="electronic" className="scroll-mt-20" aria-labelledby="electronic-h">
                <h2 id="electronic-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  24. Electronic communications, transactions, and signatures
                </h2>
                <p className="mt-3">
                  Visiting the Services, sending us emails, and completing
                  online forms constitute electronic communications. You
                  consent to receive electronic communications, and agree
                  that all agreements, notices, disclosures, and other
                  communications we provide electronically satisfy any legal
                  requirement that such communication be in writing. You
                  hereby agree to the use of electronic signatures,
                  contracts, orders, and other records, and to electronic
                  delivery of notices, policies, and records of transactions,
                  and waive any rights or requirements under any statute or
                  regulation requiring an original signature or delivery of
                  non-electronic records.
                </p>
              </section>

              <section id="sms" className="scroll-mt-20" aria-labelledby="sms-h">
                <h2 id="sms-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  25. SMS text messaging
                </h2>

                <h3 className="mt-6 text-base font-medium text-stone-900 dark:text-stone-100">
                  Opting out
                </h3>
                <p className="mt-2">
                  If at any time you wish to stop receiving SMS messages from
                  us, simply reply to the text with &ldquo;STOP.&rdquo; You
                  may receive a confirming SMS message; after that, you will
                  no longer receive SMS messages from us. To join again,
                  please sign up as you did the first time.
                </p>

                <h3 className="mt-6 text-base font-medium text-stone-900 dark:text-stone-100">
                  Message and data rates
                </h3>
                <p className="mt-2">
                  Message and data rates may apply to any SMS messages sent or
                  received. Rates are determined by your carrier and mobile
                  plan. Carriers are not liable for delayed or undelivered
                  messages. Contact your wireless provider with questions
                  about your plan.
                </p>

                <h3 className="mt-6 text-base font-medium text-stone-900 dark:text-stone-100">
                  Support
                </h3>
                <p className="mt-2">
                  If you have questions or need assistance regarding our SMS
                  communications, reply with the keyword HELP, or email us at{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-2">
                    {CONTACT_EMAIL}
                  </a>
                  . For privacy questions, please read our{" "}
                  <a
                    href={`${SITE_URL}/privacy`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-words underline underline-offset-2"
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
              </section>

              <section id="misc" className="scroll-mt-20" aria-labelledby="misc-h">
                <h2 id="misc-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  26. Miscellaneous
                </h2>
                <p className="mt-3">
                  These Legal Terms and any policies or operating rules
                  posted by us on the Services constitute the entire
                  agreement between you and us. Our failure to exercise or
                  enforce any right or provision shall not operate as a
                  waiver. These Legal Terms operate to the fullest extent
                  permissible by law. We may assign any of our rights and
                  obligations to others at any time, and are not liable for
                  any loss, damage, delay, or failure to act caused by any
                  cause beyond our reasonable control. If any provision is
                  determined to be unlawful, void, or unenforceable, that
                  provision is deemed severable and does not affect the
                  validity of the remaining provisions. No joint venture,
                  partnership, employment, or agency relationship is created
                  between you and us as a result of these Legal Terms or use
                  of the Services.
                </p>
              </section>

              <section id="contact" className="scroll-mt-20" aria-labelledby="contact-h">
                <h2 id="contact-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  27. Contact us
                </h2>
                <p className="mt-3">
                  In order to resolve a complaint regarding the Services or
                  to receive further information regarding use of the
                  Services, please contact us at:
                </p>
                <address className="mt-3 not-italic text-stone-700 dark:text-stone-300">
                  <span className="font-semibold text-stone-900 dark:text-stone-50">
                    {COMPANY_NAME}
                  </span>
                  <br />
                  {MAILING_ADDRESS_LINES.map((line) => (
                    <span key={line}>
                      {line}
                      <br />
                    </span>
                  ))}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-2">
                    {CONTACT_EMAIL}
                  </a>
                </address>
              </section>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}