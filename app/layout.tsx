import './globals.css';
export const metadata = { title: 'Acowale CRM', description: 'Customer Feedback Platform' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen text-gray-900">{children}</body>
    </html>
  );
}