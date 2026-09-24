import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ominet Digital",
  description:
    "A digital ecosystem for publishing, creativity, professional identity and technology, founded by Omini Nfawa.",
};

const THEME_INIT = `
try {
  var t = localStorage.getItem('omd-theme') || 'light';
  document.documentElement.setAttribute('data-theme', t);
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
