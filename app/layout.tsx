// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import Navbar from "@/app/_components/navbar";
import Footer from "@/app/_components/footer";
import { LanguageProvider } from "@/contexts/language-context";
import { Toaster } from "@/components/ui/sonner";
import { currentUser } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "SA Tours - Explore South Africa's Best Domestic Tours",
    template: "%s | SA Tours",
  },
  description: "Discover and book amazing tours across South Africa. From wildlife safaris to city tours, find your perfect adventure with trusted local operators.",
  keywords: ["South Africa tours", "domestic tours", "safari", "Cape Town tours", "Johannesburg tours", "tour booking"],
  openGraph: {
    title: "SA Tours - Explore South Africa",
    description: "Book your next South African adventure",
    type: "website",
  },
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const user = await currentUser();
  return (
    <html lang="en">
      <LanguageProvider>
        <body className={inter.className}>
          <Navbar user={user} />
          <Toaster position="bottom-left" richColors theme="light" />
          {children}
          <Footer />
        </body>
      </LanguageProvider>
    </html>
  );
}