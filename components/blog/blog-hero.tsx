// components/blog/blog-hero.tsx
import { Newspaper } from "lucide-react";

export function BlogHero() {
  return (
    <div className="bg-gradient-to-br from-primary to-primary/80 text-white py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6">
            <Newspaper className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Travel Blog</h1>
          <p className="text-xl text-white/90">
            Discover travel tips, destination guides, and inspiration for your South African adventure
          </p>
        </div>
      </div>
    </div>
  );
}