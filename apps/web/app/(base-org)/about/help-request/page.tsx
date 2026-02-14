'use client';

import HelpRequestForm from 'apps/web/src/components/HelpRequest/HelpRequestForm';

export default function HelpRequestPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Submit a Help Request
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Need assistance? Fill out the form below and our support team will get back to you as
            soon as possible.
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <HelpRequestForm />
        </div>

        <div className="mt-8 rounded-lg bg-gray-50 p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900">Looking for quick answers?</h3>
          <p className="mt-2 text-gray-600">
            Check out our{' '}
            <a href="/about/faqs" className="text-blue-600 underline hover:text-blue-800">
              FAQs page
            </a>{' '}
            or visit the{' '}
            <a
              href="https://help.coinbase.com/en/base"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
            >
              Help Center
            </a>{' '}
            for immediate assistance.
          </p>
        </div>
      </div>
    </main>
  );
}
