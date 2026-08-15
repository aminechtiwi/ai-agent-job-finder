import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Autonomous Recruiter & Headhunter AI Agent",
  description:
    "An autonomous AI agent that parses a candidate's CV, runs live Google & LinkedIn market research, and maps them to the top 3 compatible job roles with a strategic resume report.",
  keywords: [
    "AI Recruiter",
    "Headhunter AI",
    "CV Analysis",
    "Job Matching",
    "Career Report",
    "LinkedIn Search",
  ],
  openGraph: {
    title: "Autonomous Recruiter & Headhunter AI Agent",
    description:
      "CV parsing → live Google & LinkedIn research → top 3 job matches + strategic resume report.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Autonomous Recruiter & Headhunter AI Agent",
    description:
      "CV parsing → live Google & LinkedIn research → top 3 job matches.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
