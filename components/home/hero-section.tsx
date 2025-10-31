// components/home/hero-section.tsx
"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLanguage } from "@/contexts/language-context"

interface HeroSectionProps {
    localDestinations: string[]
    internationalCountries: string[]
}

export function HeroSection({ localDestinations, internationalCountries }: HeroSectionProps) {
    const { currentLang, currentIndex, isAnimating } = useLanguage()
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleDestinationSelect = (value: string, type: "local" | "international") => {
        const params = new URLSearchParams()

        // Clear previous filters
        params.delete("localDestination")
        params.delete("country")

        // Set new filter
        if (type === "local") {
            params.set("localDestination", value)
        } else {
            params.set("country", value)
        }

        router.push(`/?${params.toString()}`)
    }

    return (
        <section className="relative text-white py-20 md:py-32 overflow-hidden">
            {/* Background Image - Southern African Landscape */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?q=80&w=2067')",
                }}
            />

            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60" />

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

                    {/* Destination Selector */}
                    <div className="max-w-2xl mx-auto">
                        <Tabs defaultValue="local" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 bg-white/20 backdrop-blur-md border border-white/20">
                                <TabsTrigger
                                    value="local"
                                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white font-medium transition-all"
                                >
                                    South Africa
                                </TabsTrigger>
                                <TabsTrigger
                                    value="international"
                                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white font-medium transition-all"
                                >
                                    Rest of Africa
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="local" className="mt-4">
                                <Select onValueChange={(value) => handleDestinationSelect(value, "local")}>
                                    <SelectTrigger className="w-full h-16 text-lg bg-white text-gray-900 border-2 border-amber-500/20 shadow-2xl hover:shadow-3xl hover:border-amber-500/40 transition-all">
                                        <SelectValue placeholder="Select your South African destination..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {localDestinations.length > 0 ? (
                                            localDestinations.map((dest) => (
                                                <SelectItem key={dest} value={dest} className="text-lg">
                                                    {dest}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="none" disabled>
                                                No destinations available
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </TabsContent>

                            <TabsContent value="international" className="mt-4">
                                <Select onValueChange={(value) => handleDestinationSelect(value, "international")}>
                                    <SelectTrigger className="w-full h-16 text-lg bg-white text-gray-900 border-2 border-amber-500/20 shadow-2xl hover:shadow-3xl hover:border-amber-500/40 transition-all">
                                        <SelectValue placeholder="Explore the rest of Africa..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {internationalCountries.length > 0 ? (
                                            internationalCountries.map((country) => (
                                                <SelectItem key={country} value={country} className="text-lg">
                                                    {country}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="none" disabled>
                                                No countries available
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Subtitle */}
                    <p className="text-xl md:text-2xl text-white/95 font-light drop-shadow-lg">
                        Connect with vetted local operators for authentic Southern African experiences
                    </p>
                </div>
            </div>

            {/* Wave Divider */}
            <div className="absolute bottom-0 left-0 right-0">
                <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                    <path
                        d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z"
                        fill="rgb(249 250 251)"
                    />
                </svg>
            </div>
        </section>
    )
}
