export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <h1 className="text-4xl font-bold text-dark-text mb-8">Terms of Service</h1>
      
      <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
        <section>
          <h2 className="text-2xl font-semibold text-dark-text mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using NextHire, you accept and agree to be bound by the terms and provision of this agreement.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-dark-text mb-4">2. Use License</h2>
          <p>
            Permission is granted to temporarily use NextHire for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose or for any public display</li>
            <li>Attempt to reverse engineer any software contained on NextHire</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-dark-text mb-4">3. User Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-dark-text mb-4">4. Privacy</h2>
          <p>
            Your use of NextHire is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-dark-text mb-4">5. Limitation of Liability</h2>
          <p>
            In no event shall NextHire or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use NextHire.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-dark-text mb-4">6. Changes to Terms</h2>
          <p>
            NextHire may revise these terms of service at any time without notice. By using this service you are agreeing to be bound by the then current version of these terms of service.
          </p>
        </section>

        <section className="pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </section>
      </div>
    </div>
  );
}

