// app/privacy-policy/page.jsx
//
// Drop this file into: app/privacy-policy/page.jsx (Next.js App Router)
// Requires Tailwind's dark mode set to "class" in tailwind.config.js:
//   module.exports = { darkMode: "class", ... }
//
// Fill in the bracketed placeholders (company name, address, contact email,
// server location, effective date) before publishing.

const COMPANY_NAME = "Backspace";
const COMPANY_LEGAL_NAME = "Backspaces Inc.";
const SITE_URL = "https://www.backspaces.com";
const CONTACT_EMAIL = "privacy@example.com";
const MAILING_ADDRESS = "None";
const LAST_UPDATED = "September 11, 2026";
const SERVER_LOCATION = "Greater Noida";

// ---- SEO metadata (Next.js App Router convention) ----
export const metadata = {
  title: `Privacy Policy | ${COMPANY_NAME}`,
  description: `Read ${COMPANY_NAME}'s Privacy Policy to learn what personal information we collect, how we use and share it, and the privacy rights and choices available to you.`,
  alternates: {
    canonical: `${SITE_URL}/privacy-policy`,
  },
  openGraph: {
    title: `Privacy Policy | ${COMPANY_NAME}`,
    description: `Learn how ${COMPANY_NAME} collects, uses, shares, and protects your personal information.`,
    url: `${SITE_URL}/privacy-policy`,
    siteName: COMPANY_NAME,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: `Privacy Policy | ${COMPANY_NAME}`,
    description: `Learn how ${COMPANY_NAME} collects, uses, shares, and protects your personal information.`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

const sections = [
  { id: "info-we-collect", label: "1. What Information Do We Collect?" },
  { id: "how-we-process", label: "2. How Do We Process Your Information?" },
  { id: "sharing", label: "3. When and With Whom Do We Share Your Personal Information?" },
  { id: "cookies", label: "4. Do We Use Cookies and Other Tracking Technologies?" },
  { id: "social-logins", label: "5. How Do We Handle Your Social Logins?" },
  { id: "international", label: "6. Is Your Information Transferred Internationally?" },
  { id: "retention", label: "7. How Long Do We Keep Your Information?" },
  { id: "minors", label: "8. Do We Collect Information From Minors?" },
  { id: "rights", label: "9. What Are Your Privacy Rights?" },
  { id: "dnt", label: "10. Controls for Do-Not-Track Features" },
  { id: "updates", label: "11. Do We Make Updates to This Notice?" },
  { id: "contact", label: "12. How Can You Contact Us About This Notice?" },
  { id: "review-data", label: "13. How Can You Review, Update, or Delete the Data We Collect From You?" },
];

function jsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Privacy Policy | ${COMPANY_NAME}`,
    description: `${COMPANY_NAME}'s Privacy Policy describing how personal information is collected, used, and shared.`,
    url: `${SITE_URL}/privacy-policy`,
    dateModified: LAST_UPDATED,
    publisher: {
      "@type": "Organization",
      name: COMPANY_LEGAL_NAME,
    },
  };
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }}
      />

      <div className="min-h-screen bg-stone-50 text-stone-800 dark:bg-neutral-950 dark:text-stone-200">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-14 md:grid-cols-[240px_1fr] md:px-10">
          {/* Sidebar / table of contents */}
          <nav
            aria-label="Table of contents"
            className="order-2 h-max md:sticky md:top-14 md:order-1"
          >
            <p className="mb-3 text-sm font-medium text-stone-500 dark:text-stone-400">
              On this page
            </p>
            <ul className="space-y-2 border-l border-stone-200 pl-4 text-sm dark:border-neutral-800">
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
                Privacy Policy
              </h1>
              <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
                Last updated: {LAST_UPDATED}
              </p>
            </header>

            <div className="prose-content max-w-none space-y-10 leading-relaxed">
              <section aria-labelledby="intro">
                <p>
                  This Privacy Notice for {COMPANY_LEGAL_NAME} (&ldquo;we,&rdquo;
                  &ldquo;us,&rdquo; or &ldquo;our&rdquo;) describes how and why we
                  might access, collect, store, use, and/or share
                  (&ldquo;process&rdquo;) your personal information when you use
                  our services (&ldquo;Services&rdquo;).
                </p>
                <p>
                  Questions or concerns? Reading this Privacy Notice will help you
                  understand your privacy rights and choices. We are responsible
                  for making decisions about how your personal information is
                  processed. If you do not agree with our policies and practices,
                  please do not use our Services.
                </p>
              </section>

              <section aria-labelledby="summary" className="rounded-lg border border-stone-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
                <h2 id="summary" className="text-lg font-semibold text-stone-900 dark:text-stone-50">
                  Summary of key points
                </h2>
                <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
                  This summary provides key points from our Privacy Notice. You
                  can find more detail on any topic using the table of contents.
                </p>
                <dl className="mt-5 space-y-4 text-sm">
                  <div>
                    <dt className="font-medium text-stone-800 dark:text-stone-200">
                      What personal information do we process?
                    </dt>
                    <dd className="mt-1 text-stone-600 dark:text-stone-400">
                      We may process personal information depending on how you
                      interact with our Services, the choices you make, and the
                      features you use.
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-stone-800 dark:text-stone-200">
                      Do we process sensitive personal information?
                    </dt>
                    <dd className="mt-1 text-stone-600 dark:text-stone-400">
                      No. We do not process sensitive personal information such
                      as racial or ethnic origin, sexual orientation, or
                      religious beliefs.
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-stone-800 dark:text-stone-200">
                      Do we collect information from third parties?
                    </dt>
                    <dd className="mt-1 text-stone-600 dark:text-stone-400">
                      We may collect information from public databases,
                      marketing partners, social media platforms, and other
                      outside sources.
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-stone-800 dark:text-stone-200">
                      What are your rights?
                    </dt>
                    <dd className="mt-1 text-stone-600 dark:text-stone-400">
                      Depending on where you live, applicable privacy law may
                      give you certain rights regarding your personal
                      information.
                    </dd>
                  </div>
                </dl>
              </section>

              <section id="info-we-collect" aria-labelledby="info-we-collect-h">
                <h2 id="info-we-collect-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  1. What information do we collect?
                </h2>

                <h3 className="mt-6 text-base font-medium text-stone-900 dark:text-stone-100">
                  Personal information you disclose to us
                </h3>
                <p className="mt-2">
                  <strong>In short:</strong> We collect personal information
                  that you provide to us.
                </p>
                <p className="mt-2">
                  We collect personal information that you voluntarily provide
                  when you register on the Services, express interest in our
                  products, participate in activities on the Services, or
                  otherwise contact us.
                </p>
                <p className="mt-2">
                  <strong>Sensitive information.</strong> We do not process
                  sensitive information.
                </p>
                <p className="mt-2">
                  All personal information you provide must be true, complete,
                  and accurate. Please notify us of any changes to such
                  information.
                </p>

                <h3 className="mt-6 text-base font-medium text-stone-900 dark:text-stone-100">
                  Information automatically collected
                </h3>
                <p className="mt-2">
                  <strong>In short:</strong> Some information — such as your IP
                  address and browser and device characteristics — is collected
                  automatically when you visit our Services.
                </p>
                <p className="mt-2">
                  This information does not reveal your specific identity but
                  may include device and usage data, such as your IP address,
                  browser and device characteristics, operating system,
                  language preferences, referring URLs, device name, country,
                  location, and information about how and when you use our
                  Services. We use this data to maintain the security and
                  operation of our Services and for internal analytics and
                  reporting. We also collect information through cookies and
                  similar technologies.
                </p>
              </section>

              <section id="how-we-process" aria-labelledby="how-we-process-h">
                <h2 id="how-we-process-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  2. How do we process your information?
                </h2>
                <p className="mt-2">
                  <strong>In short:</strong> We process your information to
                  provide, improve, and administer our Services, communicate
                  with you, prevent fraud, and comply with law. We may also
                  process your information for other purposes with your
                  consent.
                </p>
                <p className="mt-2">
                  We process your personal information for a variety of reasons
                  depending on how you interact with our Services, and only
                  when we have a valid legal basis to do so.
                </p>
              </section>

              <section id="sharing" aria-labelledby="sharing-h">
                <h2 id="sharing-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  3. When and with whom do we share your personal information?
                </h2>
                <p className="mt-2">
                  <strong>In short:</strong> We may share information in the
                  specific situations below and with the following types of
                  third parties.
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-6">
                  <li>
                    <strong>Business transfers.</strong> We may share or
                    transfer your information in connection with a merger, sale
                    of company assets, financing, or acquisition of all or part
                    of our business.
                  </li>
                  <li>
                    <strong>Affiliates.</strong> We may share information with
                    our affiliates, who will be required to honor this Privacy
                    Notice. Affiliates include our parent company and any
                    subsidiaries or joint venture partners.
                  </li>
                  <li>
                    <strong>Business partners.</strong> We may share your
                    information with business partners to offer you certain
                    products, services, or promotions.
                  </li>
                </ul>
              </section>

              <section id="cookies" aria-labelledby="cookies-h">
                <h2 id="cookies-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  4. Do we use cookies and other tracking technologies?
                </h2>
                <p className="mt-2">
                  <strong>In short:</strong> We may use cookies and other
                  tracking technologies to collect and store your information.
                </p>
                <p className="mt-2">
                  We use cookies and similar technologies (like web beacons and
                  pixels) to gather information when you interact with our
                  Services. Some of these help maintain security, prevent
                  crashes, fix bugs, and save your preferences. We also permit
                  third parties and service providers to use tracking
                  technologies for analytics and advertising. See our Cookie
                  Notice for details on how to manage your preferences.
                </p>
              </section>

              <section id="social-logins" aria-labelledby="social-logins-h">
                <h2 id="social-logins-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  5. How do we handle your social logins?
                </h2>
                <p className="mt-2">
                  <strong>In short:</strong> If you register or log in using a
                  third-party social media account, we may have access to
                  certain information about you.
                </p>
                <p className="mt-2">
                  Where you choose this option, we receive certain profile
                  information from your social media provider, which may
                  include your name, email address, friends list, and profile
                  picture. We use this information only for the purposes
                  described in this Notice. We are not responsible for how your
                  social media provider uses your information — please review
                  their privacy notice separately.
                </p>
              </section>

              <section id="international" aria-labelledby="international-h">
                <h2 id="international-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  6. Is your information transferred internationally?
                </h2>
                <p className="mt-2">
                  <strong>In short:</strong> We may transfer, store, and process
                  your information in countries other than your own.
                </p>
                <p className="mt-2">
                  Our servers are located in {SERVER_LOCATION}. Your information
                  may be transferred to, stored by, and processed in our
                  facilities and in the facilities of third parties with whom
                  we share your data. If you are located in the European
                  Economic Area, United Kingdom, or Switzerland, note that these
                  countries may have differing data protection laws; we take
                  reasonable measures to protect your information in accordance
                  with this Notice and applicable law.
                </p>
              </section>

              <section id="retention" aria-labelledby="retention-h">
                <h2 id="retention-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  7. How long do we keep your information?
                </h2>
                <p className="mt-2">
                  <strong>In short:</strong> We keep your information for as
                  long as necessary to fulfill the purposes outlined in this
                  Notice, unless a longer period is required by law.
                </p>
                <p className="mt-2">
                  When we no longer have an ongoing legitimate need to process
                  your information, we will delete or anonymize it, or, if that
                  isn&rsquo;t possible, securely store it and isolate it from
                  further processing until deletion is possible.
                </p>
              </section>

              <section id="minors" aria-labelledby="minors-h">
                <h2 id="minors-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  8. Do we collect information from minors?
                </h2>
                <p className="mt-2">
                  <strong>In short:</strong> We do not knowingly collect data
                  from or market to children under 18 years of age.
                </p>
                <p className="mt-2">
                  By using the Services, you represent that you are at least 18,
                  or that you are the parent or guardian of a minor and consent
                  to that minor&rsquo;s use of the Services. If we learn that
                  personal information from a user under 18 has been collected,
                  we will deactivate the account and take reasonable steps to
                  promptly delete such data. If you become aware of any such
                  data, please contact us at{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-2">
                    {CONTACT_EMAIL}
                  </a>
                  .
                </p>
              </section>

              <section id="rights" aria-labelledby="rights-h">
                <h2 id="rights-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  9. What are your privacy rights?
                </h2>
                <p className="mt-2">
                  <strong>In short:</strong> You may review, change, or
                  terminate your account at any time, depending on your
                  location.
                </p>
                <p className="mt-2">
                  <strong>Withdrawing your consent.</strong> Where we rely on
                  your consent to process your information, you may withdraw it
                  at any time by contacting us using the details in
                  &ldquo;How can you contact us about this notice?&rdquo; below.
                  This will not affect the lawfulness of processing carried out
                  before the withdrawal.
                </p>
                <p className="mt-2">
                  <strong>Account information.</strong> You may review, change,
                  or request termination of your account at any time. Upon
                  termination, we will deactivate or delete your account,
                  though we may retain some information to prevent fraud,
                  troubleshoot issues, assist investigations, or comply with
                  legal requirements.
                </p>
              </section>

              <section id="dnt" aria-labelledby="dnt-h">
                <h2 id="dnt-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  10. Controls for Do-Not-Track features
                </h2>
                <p className="mt-2">
                  Most browsers and some mobile operating systems include a
                  Do-Not-Track (&ldquo;DNT&rdquo;) feature. As no uniform
                  technology standard for recognizing DNT signals has been
                  finalized, we do not currently respond to DNT signals. If a
                  standard is adopted that we must follow, we will update this
                  Notice accordingly.
                </p>
              </section>

              <section id="updates" aria-labelledby="updates-h">
                <h2 id="updates-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  11. Do we make updates to this notice?
                </h2>
                <p className="mt-2">
                  <strong>In short:</strong> Yes, we will update this Notice as
                  necessary to stay compliant with relevant laws.
                </p>
                <p className="mt-2">
                  We may update this Privacy Notice from time to time. The
                  updated version will be indicated by a revised &ldquo;Last
                  updated&rdquo; date. If we make material changes, we will
                  notify you by prominently posting a notice or sending a
                  direct notification.
                </p>
              </section>

              <section id="contact" aria-labelledby="contact-h">
                <h2 id="contact-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  12. How can you contact us about this notice?
                </h2>
                <p className="mt-2">
                  If you have questions or comments about this Notice, you may
                  contact us at:
                </p>
                <address className="mt-3 not-italic text-stone-700 dark:text-stone-300">
                  {COMPANY_LEGAL_NAME}
                  <br />
                  {MAILING_ADDRESS}
                  <br />
                  <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-2">
                    {CONTACT_EMAIL}
                  </a>
                </address>
              </section>

              <section id="review-data" aria-labelledby="review-data-h">
                <h2 id="review-data-h" className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                  13. How can you review, update, or delete the data we collect from you?
                </h2>
                <p className="mt-2">
                  Based on the applicable laws in your country, you may have
                  the right to request access to the personal information we
                  collect from you, learn how we have processed it, correct
                  inaccuracies, or request deletion. You may also have the
                  right to withdraw your consent to our processing. These
                  rights may be limited in some circumstances by applicable
                  law. To submit a request, please contact us using the details
                  above.
                </p>
              </section>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}