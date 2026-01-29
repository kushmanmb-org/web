import { useCallback, useState } from 'react';
import { Button, ButtonVariants } from 'apps/web/src/components/Button/Button';
import Label from 'apps/web/src/components/Label';
import Fieldset from 'apps/web/src/components/Fieldset';
import { logger } from 'apps/web/src/utils/logger';
import type { HelpRequestData, HelpRequestResponse } from 'apps/web/app/api/help-request/route';

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
};

const categories = [
  { value: '', label: 'Select a category' },
  { value: 'technical', label: 'Technical Support' },
  { value: 'account', label: 'Account Issues' },
  { value: 'billing', label: 'Billing & Payments' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'other', label: 'Other' },
];

export default function HelpRequestForm() {
  const [formState, setFormState] = useState<FormState>({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormState((prev) => ({ ...prev, [name]: value }));
      // Clear status when user starts typing again
      if (submitStatus.type) {
        setSubmitStatus({ type: null, message: '' });
      }
    },
    [submitStatus.type],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (isSubmitting) return;

      setIsSubmitting(true);
      setSubmitStatus({ type: null, message: '' });

      try {
        const requestData: HelpRequestData = {
          name: formState.name.trim(),
          email: formState.email.trim(),
          subject: formState.subject.trim(),
          message: formState.message.trim(),
          category: formState.category || undefined,
        };

        const response = await fetch('/api/help-request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });

        const data = (await response.json()) as HelpRequestResponse;

        if (response.ok && data.success) {
          setSubmitStatus({ type: 'success', message: data.message });
          // Reset form on success
          setFormState({
            name: '',
            email: '',
            subject: '',
            message: '',
            category: '',
          });
        } else {
          setSubmitStatus({ type: 'error', message: data.message || 'Failed to submit request' });
        }
      } catch (error) {
        logger.error('Error submitting help request:', error);
        setSubmitStatus({
          type: 'error',
          message: 'An unexpected error occurred. Please try again.',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState, isSubmitting],
  );

  const onSubmitHandler = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      void handleSubmit(e);
    },
    [handleSubmit],
  );

  const isFormValid =
    formState.name.trim() !== '' &&
    formState.email.trim() !== '' &&
    formState.subject.trim() !== '' &&
    formState.message.trim().length >= 10;

  return (
    <form onSubmit={onSubmitHandler} className="flex flex-col gap-6">
      <Fieldset>
        <Label htmlFor="name">Name *</Label>
        <input
          type="text"
          id="name"
          name="name"
          value={formState.name}
          onChange={handleInputChange}
          required
          maxLength={100}
          className="w-full rounded-lg border border-gray-40/20 bg-white px-4 py-3 text-black transition-colors focus:border-blue focus:outline-none"
          placeholder="Your full name"
        />
      </Fieldset>

      <Fieldset>
        <Label htmlFor="email">Email *</Label>
        <input
          type="email"
          id="email"
          name="email"
          value={formState.email}
          onChange={handleInputChange}
          required
          maxLength={255}
          className="w-full rounded-lg border border-gray-40/20 bg-white px-4 py-3 text-black transition-colors focus:border-blue focus:outline-none"
          placeholder="your.email@example.com"
        />
      </Fieldset>

      <Fieldset>
        <Label htmlFor="category">Category</Label>
        <select
          id="category"
          name="category"
          value={formState.category}
          onChange={handleInputChange}
          className="w-full rounded-lg border border-gray-40/20 bg-white px-4 py-3 text-black transition-colors focus:border-blue focus:outline-none"
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </Fieldset>

      <Fieldset>
        <Label htmlFor="subject">Subject *</Label>
        <input
          type="text"
          id="subject"
          name="subject"
          value={formState.subject}
          onChange={handleInputChange}
          required
          maxLength={200}
          className="w-full rounded-lg border border-gray-40/20 bg-white px-4 py-3 text-black transition-colors focus:border-blue focus:outline-none"
          placeholder="Brief description of your issue"
        />
      </Fieldset>

      <Fieldset>
        <Label htmlFor="message">Message *</Label>
        <textarea
          id="message"
          name="message"
          value={formState.message}
          onChange={handleInputChange}
          required
          rows={6}
          minLength={10}
          maxLength={5000}
          className="w-full rounded-lg border border-gray-40/20 bg-white px-4 py-3 text-black transition-colors focus:border-blue focus:outline-none"
          placeholder="Please provide details about your request... (minimum 10 characters)"
        />
        <p className="mt-1 text-sm text-gray-60">
          {formState.message.length}/5000 characters
        </p>
      </Fieldset>

      {submitStatus.type && (
        <div
          role="alert"
          aria-live="polite"
          className={`rounded-lg p-4 ${
            submitStatus.type === 'success'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {submitStatus.message}
        </div>
      )}

      <Button
        type="submit"
        variant={ButtonVariants.Black}
        disabled={!isFormValid || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Help Request'}
      </Button>
    </form>
  );
}
