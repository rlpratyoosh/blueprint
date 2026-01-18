import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blueprint - A Full-Stack Template",
  description: "A production-ready Next.js & NestJS starter template with Authentication, Docker, and PostgreSQL.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
