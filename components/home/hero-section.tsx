// components/home/hero-section.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ChevronDown, Globe2, MapPin, Search } from "lucide-react"
import { resolveScope, type ScopeValue } from "@/lib/scope"

export function HeroSection() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") ?? "")
    const [scope, setScope] = useState<ScopeValue>(() =>
        resolveScope({
            scopeParam: searchParams.get("scope"),
            country: searchParams.get("country"),
            localDestination: searchParams.get("localDestination"),
        })
    )

    useEffect(() => {
        setScope(
            resolveScope({
                scopeParam: searchParams.get("scope"),
                country: searchParams.get("country"),
                localDestination: searchParams.get("localDestination"),
            })
        )
        setSearchQuery(searchParams.get("search") ?? "")
    }, [searchParams])

    const heroCopy =
        scope === "international"
            ? {
                title: "Explore the rest of Africa with trusted guides",
                subtitle: "Cross-border safaris, islands, and city breaks curated for easy planning.",
            }
            : {
                title: "Plan your next South African escape",
                subtitle: "From Cape Town to Kruger, find locally crafted trips across all nine provinces.",
            }

    const backgroundImage =
        scope === "international"
            ? `linear-gradient(180deg, rgba(2, 48, 64, 0.6) 0%, rgba(0, 0, 0, 0) 35%), linear-gradient(0deg, rgba(0, 0, 0, 0.28), rgba(0, 0, 0, 0.28)), url('https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1800&q=80')`
            : `linear-gradient(180deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0) 35%), linear-gradient(0deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url('/pexels-magda-ehlers-pexels-3814243.jpg')`

    const applyScopeToParams = (params: URLSearchParams, nextScope: ScopeValue) => {
        params.set("scope", nextScope)
        params.delete("page")
        params.delete("category")

        if (nextScope === "local") {
            params.delete("country")
        } else {
            params.delete("localDestination")
        }
    }

    const pushParams = (params: URLSearchParams) => {
        const queryString = params.toString()
        router.push(queryString ? `/?${queryString}` : "/")
    }

    const handleScopeChange = (nextScope: ScopeValue) => {
        setScope(nextScope)
        const params = new URLSearchParams(searchParams.toString())
        applyScopeToParams(params, nextScope)
        pushParams(params)
    }

    const handleHeroSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const params = new URLSearchParams(searchParams.toString())

        if (searchQuery.trim()) {
            params.set("search", searchQuery.trim())
        } else {
            params.delete("search")
        }

        applyScopeToParams(params, scope)

        pushParams(params)
    }

    const activeScope = scope === "international"
        ? { label: "Rest of Africa", Icon: Globe2 }
        : { label: "South Africa", Icon: MapPin }

    const ActiveIcon = activeScope.Icon

    return (
        <section className="relative isolate text-white min-h-[600px] md:min-h-[760px] py-16 md:py-32 flex items-center overflow-hidden">
            {/* Background image with dark top overlay */}
            <div
                className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage,
                }}
            />
            <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-b from-transparent via-white/60 to-white" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-3xl md:text-5xl font-bold leading-tight drop-shadow-lg">
                            {heroCopy.title}
                        </h1>
                        <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto drop-shadow-md">
                            {heroCopy.subtitle}
                        </p>
                    </div>

                    {/* Subtitle + Hero search */}
                    <form
                        onSubmit={handleHeroSearch}
                        className="mx-auto w-full max-w-3xl"
                    >
                        <div className="flex flex-col md:flex-row items-stretch gap-2 bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-full border border-white/70 shadow-md p-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="flex w-full md:w-auto items-center gap-2 rounded-xl md:rounded-full bg-white px-4 py-3 text-left text-sm md:text-base font-semibold text-gray-800 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
                                    >
                                        <ActiveIcon className="h-4 w-4 text-amber-600" />
                                        <span>{activeScope.label}</span>
                                        <ChevronDown className="h-4 w-4 text-gray-500" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="min-w-[200px]">
                                    <DropdownMenuItem onSelect={() => handleScopeChange("local")} className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-amber-600" />
                                        <span>South Africa</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleScopeChange("international")} className="flex items-center gap-2">
                                        <Globe2 className="h-4 w-4 text-amber-600" />
                                        <span>Rest of Africa</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <div className="flex flex-1 items-center gap-3 rounded-xl md:rounded-full bg-white px-4">
                                <Search className="text-gray-400 w-5 h-5 shrink-0" />
                                <Input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    placeholder="Search destinations and experiences"
                                    className="h-12 md:h-14 border-0 bg-transparent px-0 text-base md:text-lg text-gray-900 focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="h-12 md:h-14 w-full md:w-auto px-6 md:px-8 rounded-xl md:rounded-full bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-sm"
                            >
                                Search
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    )
}
