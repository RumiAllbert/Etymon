import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-2xl font-serif hover:opacity-80 transition-opacity"
          >
            Etymon.ai
          </Link>
        </div>
        <div className="prose dark:prose-invert max-w-none">
          <h1 className="text-3xl font-serif mb-8">Privacy Policy</h1>

          <p className="mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <h2 className="text-2xl font-serif mt-8 mb-4">Introduction</h2>
          <p>
            Welcome to Etymon.ai. We respect your privacy and are committed to
            protecting your personal data. This privacy policy will inform you
            about how we look after your personal data when you visit our
            website and tell you about your privacy rights and how the law
            protects you.
          </p>

          <h2 className="text-2xl font-serif mt-8 mb-4">Data We Collect</h2>
          <p>We collect and process the following data:</p>
          <ul className="list-disc pl-6 mb-6">
            <li>Authentication data when you sign in with Google</li>
            <li>Usage data (words searched, number of searches)</li>
            <li>Technical data (IP address, browser type and version)</li>
          </ul>

          <h2 className="text-2xl font-serif mt-8 mb-4">
            How We Use Your Data
          </h2>
          <p>We use your personal data for the following purposes:</p>
          <ul className="list-disc pl-6 mb-6">
            <li>To provide and maintain our service</li>
            <li>To manage your account and verify your identity</li>
            <li>To track your credit usage and search history</li>
            <li>To improve our service and user experience</li>
          </ul>

          <h2 className="text-2xl font-serif mt-8 mb-4">Data Storage</h2>
          <p>
            Your data is stored securely using industry-standard practices. We
            use local storage for temporary data like search history and
            credits, and secure databases for user authentication data.
          </p>

          <h2 className="text-2xl font-serif mt-8 mb-4">Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 mb-6">
            <li>Access your personal data</li>
            <li>Correct your personal data</li>
            <li>Delete your personal data</li>
            <li>Object to processing of your personal data</li>
            <li>Request restriction of processing your personal data</li>
          </ul>

          <h2 className="text-2xl font-serif mt-8 mb-4">Contact</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact
            us at privacy@etymon.ai
          </p>

          <h2 className="text-2xl font-serif mt-8 mb-4">
            Changes to This Policy
          </h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page
            and updating the "Last updated" date at the top of this policy.
          </p>
        </div>
      </div>
    </div>
  );
}
