// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import Navbar from "@/app/_components/navbar";
import Footer from "@/app/_components/footer";
import { LanguageProvider } from "@/contexts/language-context";
import { Toaster } from "@/components/ui/sonner";
import { currentUser } from "@/lib/auth";
import NextTopLoader from "nextjs-toploader";
import { PHProvider } from "@/contexts/posthog";

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
      <body className={inter.className}>
        <LanguageProvider>
          <NextTopLoader
            color="#f97316"
            initialPosition={0.08}
            crawlSpeed={200}
            height={3}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
            shadow="0 0 10px #f97316,0 0 5px #f97316"
            zIndex={9999}
          />
          <PHProvider>
            <Navbar user={user} />
            <Toaster position="bottom-left" richColors theme="light" />
            {children}
            <Footer />
          </PHProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}