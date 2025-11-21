// components/home/hero-section.tsx
"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export function HeroSection() {
    const { currentLang, currentIndex, isAnimating } = useLanguage()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") ?? "")

    const handleHeroSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const params = new URLSearchParams(searchParams.toString())

        if (searchQuery.trim()) {
            params.set("search", searchQuery.trim())
        } else {
            params.delete("search")
        }

        params.delete("page")
        router.push(`/?${params.toString()}`)
    }

    return (
        <section className="relative isolate text-white min-h-[720px] py-20 md:py-32 flex items-center overflow-hidden">
            {/* Background image with dark top overlay */}
            <div
                className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: `linear-gradient(180deg, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0) 35%), linear-gradient(0deg, rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0.25)), url('https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?q=80&w=2067')`,
                }}
            />
            <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-b from-transparent via-white/60 to-white" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    {/* Animated Text */}
                    <div className="space-y-2">
                        <div
                            className={`text-5xl md:text-7xl font-bold transition-all duration-300 ${isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
                                }`}
                        >
                            <span className="inline-block drop-shadow-lg bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                                Vakashaa
                            </span>{" "}
                            <span className="font-normal drop-shadow-lg">{currentLang.to}</span>
                        </div>

                        {currentIndex > 0 && <p className="text-sm text-white/90 font-medium drop-shadow">{currentLang.name}</p>}
                    </div>

                    {/* Subtitle + Hero search */}
                    <div className="space-y-6">
                        <p className="text-xl md:text-2xl text-white/95 font-light drop-shadow-lg">
                            Connect with vetted local operators for authentic Southern African experiences
                        </p>

                        <form
                            onSubmit={handleHeroSearch}
                            className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/40 flex flex-col md:flex-row gap-4 mx-auto"
                        >
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <Input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    placeholder="Search tours..."
                                    className="h-14 pl-12 text-lg bg-white text-gray-900 border-0 ring-0 focus-visible:ring-2 focus-visible:ring-amber-500/60"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="h-14 px-8 text-lg rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-lg"
                            >
                                Search tours
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    )
}
