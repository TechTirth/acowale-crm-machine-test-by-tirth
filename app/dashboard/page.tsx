'use client';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, distribution: {} as Record<string, number> });
  const [feedback, setFeedback] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/analytics').then(res => res.json()),
      fetch('/api/feedback').then(res => res.json())
    ]).then(([analyticsData, feedbackData]) => {
      setStats(analyticsData);
      setFeedback(feedbackData.data || []);
    });
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Admin Console</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">Total Feedback</h2>
          <p className="text-4xl font-bold">{stats.total}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-4">Category Distribution</h2>
          <div className="flex space-x-4">
            {Object.entries(stats.distribution).map(([cat, count]) => (
              <div key={cat} className="flex flex-col">
                <span className="text-xl font-bold">{count as number}</span>
                <span className="text-xs text-gray-500 capitalize">{cat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-semibold text-lg">Recent Submissions</h2>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm">
              <th className="p-4 font-medium border-b">Category</th>
              <th className="p-4 font-medium border-b">Comment</th>
              <th className="p-4 font-medium border-b">Date</th>
            </tr>
          </thead>
          <tbody>
            {feedback.map((item) => (
              <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-4"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs capitalize">{item.category}</span></td>
                <td className="p-4 text-sm text-gray-700">{item.comment}</td>
                <td className="p-4 text-sm text-gray-500">{new Date(item.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}