import '../globals.css';
import { AuthProvider } from '@/context/auth-context';

export const metadata = {
  title: 'Bladehound — Dark Fantasy Idle RPG',
  description: 'A premium dark medieval fantasy idle RPG',
};

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="min-h-screen text-bone antialiased" suppressHydrationWarning>
          <main className="flex min-h-screen flex-col">{children}</main>
        </body>
      </html>
    </AuthProvider>
  );
}