import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CrewRoute Mobile',
  description: 'AI Field Tool for Landscaping',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#0A0C14' }}>
        {children}
      </body>
    </html>
  );
}