'use client';
import { useState } from 'react';

export default function FeedbackForm() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(formData)),
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        setStatus('Thank you for your feedback!');
        (e.target as HTMLFormElement).reset();
      } else throw new Error('Submission failed');
    } catch (err) {
      setStatus('Error submitting feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto mt-20 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <h1 className="text-2xl font-bold mb-6 text-center">Acowale Feedback</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select name="category" className="w-full p-2 border rounded-lg bg-gray-50" required>
            <option value="">Select a category</option>
            <option value="bug">Bug Report</option>
            <option value="feature">Feature Request</option>
            <option value="support">Support</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Comments</label>
          <textarea name="comment" rows={4} className="w-full p-2 border rounded-lg bg-gray-50" required></textarea>
        </div>
        <button disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition">
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </button>
        {status && <p className="text-sm text-center mt-4 text-gray-600">{status}</p>}
      </form>
    </main>
  );
}