// components/tours/quote-request-form.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Calendar, Users, Minus, Plus, Loader2, CheckCircle2, MessageCircle } from "lucide-react";
import { createQuoteRequest } from "@/actions/quote-requests";

interface QuoteRequestFormProps {
    tour: {
        id: string;
        title: string;
        priceFrom: number | null; // In cents
        availableDates: string[];
        availableMonths: number[];
        maxCapacity: number | null;
    };
    user?: {
        name?: string | null;
        email?: string | null;
        phone?: string | null;
    } | null;
}

export function QuoteRequestForm({ tour, user }: QuoteRequestFormProps) {
    const router = useRouter();
    const [openDesktop, setOpenDesktop] = useState(false);
    const [openMobile, setOpenMobile] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [quoteReference, setQuoteReference] = useState("");

    // Form state
    const [preferredDate, setPreferredDate] = useState("");
    const [flexibleDates, setFlexibleDates] = useState(false);
    const [adults, setAdults] = useState(2);
    const [children, setChildren] = useState(0);
    const [childAges, setChildAges] = useState<number[]>([]);
    const [budgetRange, setBudgetRange] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerWhatsapp, setCustomerWhatsapp] = useState("");
    const [whatsappSameAsPhone, setWhatsappSameAsPhone] = useState(true);
    const [specialRequirements, setSpecialRequirements] = useState("");

    // Pre-fill form when user data is available
    useEffect(() => {
        if (user) {
            setCustomerName(user.name || "");
            setCustomerEmail(user.email || "");
            setCustomerPhone(user.phone || "");
        }
    }, [user]);

    // Update child ages array when children count changes
    useEffect(() => {
        if (children > childAges.length) {
            setChildAges([...childAges, ...Array(children - childAges.length).fill(0)]);
        } else if (children < childAges.length) {
            setChildAges(childAges.slice(0, children));
        }
    }, [children, childAges]);

    const formatPrice = (priceInCents: number) => {
        const rands = priceInCents / 100;
        return `R${rands.toLocaleString('en-ZA')}`;
    };

    const totalGuests = adults + children;
    const isOverCapacity = tour.maxCapacity ? totalGuests > tour.maxCapacity : false;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!preferredDate) {
            alert("Please select a preferred date");
            return;
        }

        if (isOverCapacity) {
            alert(`Maximum capacity is ${tour.maxCapacity} guests`);
            return;
        }

        if (!specialRequirements.trim()) {
            alert("Please provide some details about your requirements");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await createQuoteRequest({
                tourId: tour.id,
                preferredDate,
                flexibleDates,
                adults,
                children,
                childAges: children > 0 ? childAges : undefined,
                budgetRange: budgetRange || undefined,
                customerName,
                customerEmail,
                customerPhone,
                customerWhatsapp: whatsappSameAsPhone ? customerPhone : (customerWhatsapp || undefined),
                specialRequirements,
            });

            if (result.success && 'data' in result) {
                setIsSuccess(true);
                setQuoteReference(result.data.quoteRequest.reference);

                // Redirect to quotes page after 2 seconds
                setTimeout(() => {
                    router.push('/customer/quotes');
                }, 2000);
            } else if (!result.success && 'error' in result) {
                alert(result.error.message || "Failed to submit quote request");
            } else {
                alert("Failed to submit quote request");
            }
        } catch (error) {
            console.error("Quote request error:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChangeDesktop = (newOpen: boolean) => {
        if (!newOpen) {
            setIsSuccess(false);
            setQuoteReference("");
        }
        setOpenDesktop(newOpen);
    };

    const handleOpenChangeMobile = (newOpen: boolean) => {
        if (!newOpen) {
            setIsSuccess(false);
            setQuoteReference("");
        }
        setOpenMobile(newOpen);
    };

    // Shared form content
    const FormContent = () => (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Quote Request Notice */}
{/*             <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <MessageCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <p className="font-medium text-blue-900">Request a Custom Quote</p>
                        <p className="text-sm text-blue-700 mt-1">
                            Share your requirements and the operator will provide a personalized quote within 24 hours.
                        </p>
                    </div>
                </div>
            </div> */}

            {/* Indicative Price */}
            {tour.priceFrom && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Indicative Starting Price</p>
                    <p className="text-xl font-bold text-gray-900">{formatPrice(tour.priceFrom)} pp</p>
                    <p className="text-xs text-gray-500 mt-1">Final price will be customized to your needs</p>
                </div>
            )}

            {/* Date Selection */}
            <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Preferred Date *
                </Label>
                {tour.availableDates.length > 0 ? (
                    <Select value={preferredDate} onValueChange={setPreferredDate} required>
                        <SelectTrigger id="date">
                            <SelectValue placeholder="Choose your preferred date" />
                        </SelectTrigger>
                        <SelectContent>
                            {tour.availableDates.map((date) => (
                                <SelectItem key={date} value={date}>
                                    {new Date(date).toLocaleDateString('en-ZA', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <Input
                        id="date"
                        type="date"
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        required
                        min={new Date().toISOString().split('T')[0]}
                    />
                )}

                <div className="flex items-center space-x-2 mt-2">
                    <Checkbox
                        id="flexible-dates"
                        checked={flexibleDates}
                        onCheckedChange={(checked) => setFlexibleDates(checked as boolean)}
                    />
                    <Label
                        htmlFor="flexible-dates"
                        className="text-sm font-normal cursor-pointer"
                    >
                        My dates are flexible
                    </Label>
                </div>
            </div>

            {/* Guest Selection */}
            <div className="space-y-4">
                <Label className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Number of Guests
                </Label>

                {/* Adults */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                        <p className="font-medium">Adults</p>
                        <p className="text-sm text-gray-600">18+ years</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setAdults(Math.max(1, adults - 1))}
                            disabled={adults <= 1}
                        >
                            <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{adults}</span>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setAdults(adults + 1)}
                            disabled={tour.maxCapacity ? totalGuests >= tour.maxCapacity : false}
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Children */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                        <p className="font-medium">Children</p>
                        <p className="text-sm text-gray-600">Under 18 years</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setChildren(Math.max(0, children - 1))}
                            disabled={children <= 0}
                        >
                            <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{children}</span>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setChildren(children + 1)}
                            disabled={tour.maxCapacity ? totalGuests >= tour.maxCapacity : false}
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Child Ages */}
                {children > 0 && (
                    <div className="space-y-2 pl-4">
                        <Label className="text-sm">Children&apos;s Ages</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {childAges.map((age, index) => (
                                <Input
                                    key={index}
                                    type="number"
                                    min="0"
                                    max="17"
                                    value={age || ''}
                                    onChange={(e) => {
                                        const newAges = [...childAges];
                                        newAges[index] = parseInt(e.target.value) || 0;
                                        setChildAges(newAges);
                                    }}
                                    placeholder={`Child ${index + 1}`}
                                    className="text-center"
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Capacity Warning */}
                {tour.maxCapacity && (
                    <p className={`text-sm ${isOverCapacity ? 'text-red-600' : 'text-gray-500'}`}>
                        {isOverCapacity
                            ? `⚠️ Maximum ${tour.maxCapacity} guests allowed`
                            : `Maximum capacity: ${tour.maxCapacity} guests`
                        }
                    </p>
                )}
            </div>

            {/* Budget Range */}
            <div className="space-y-2">
                <Label htmlFor="budget">Budget Range (Optional)</Label>
                <Select value={budgetRange} onValueChange={setBudgetRange}>
                    <SelectTrigger id="budget">
                        <SelectValue placeholder="Select your budget range" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="under-5000">Under R5,000</SelectItem>
                        <SelectItem value="5000-10000">R5,000 - R10,000</SelectItem>
                        <SelectItem value="10000-20000">R10,000 - R20,000</SelectItem>
                        <SelectItem value="20000-50000">R20,000 - R50,000</SelectItem>
                        <SelectItem value="over-50000">Over R50,000</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Separator />

            {/* Contact Information */}
            <div className="space-y-4">
                <h3 className="font-semibold">Contact Information</h3>

                <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                        id="name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                        placeholder="John Doe"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                        id="email"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        required
                        placeholder="john@example.com"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                        id="phone"
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        required
                        placeholder="+27 12 345 6789"
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="whatsapp-same"
                        checked={whatsappSameAsPhone}
                        onCheckedChange={(checked) => setWhatsappSameAsPhone(checked as boolean)}
                    />
                    <Label
                        htmlFor="whatsapp-same"
                        className="text-sm font-normal cursor-pointer"
                    >
                        My WhatsApp number is the same as my phone number
                    </Label>
                </div>

                {!whatsappSameAsPhone && (
                    <div className="space-y-2">
                        <Label htmlFor="whatsapp">WhatsApp Number</Label>
                        <Input
                            id="whatsapp"
                            type="tel"
                            value={customerWhatsapp}
                            onChange={(e) => setCustomerWhatsapp(e.target.value)}
                            placeholder="+27 12 345 6789"
                        />
                    </div>
                )}
            </div>

            {/* Special Requirements */}
            <div className="space-y-2">
                <Label htmlFor="requirements">
                    Your Requirements *
                </Label>
                <Textarea
                    id="requirements"
                    value={specialRequirements}
                    onChange={(e) => setSpecialRequirements(e.target.value)}
                    placeholder="Tell us about your requirements:&#10;• Any dietary restrictions?&#10;• Accessibility needs?&#10;• Accommodation preferences?&#10;• Activities you're interested in?&#10;• Any other special requests?"
                    rows={6}
                    required
                />
                <p className="text-xs text-gray-500">
                    The more details you provide, the more accurate your quote will be
                </p>
            </div>

            {/* Submit Button */}
            <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting || !preferredDate || isOverCapacity || !specialRequirements.trim()}
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending Request...
                    </>
                ) : (
                    <>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Request Free Quote
                    </>
                )}
            </Button>

            <p className="text-xs text-center text-gray-500">
                Free quote • No obligation • Response within 24 hours
            </p>
        </form>
    );

    // Success state content
    const SuccessContent = () => (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-600" />
            <h2 className="text-2xl font-bold">Quote Request Sent!</h2>
            <p className="text-gray-600 text-center">
                Your request reference is: <br />
                <span className="font-mono font-bold text-lg">{quoteReference}</span>
            </p>
            <div className="text-sm text-gray-600 text-center space-y-2 max-w-md">
                <p>✓ The operator will review your requirements</p>
                <p>✓ You&apos;ll receive a personalized quote within 24 hours</p>
                <p>✓ Check your email and quote dashboard for updates</p>
            </div>
            <p className="text-xs text-gray-500 text-center mt-4">
                Redirecting to your quotes...
            </p>
        </div>
    );

    return (
        <>
            {/* Desktop Dialog */}
            <div className="hidden md:block">
                <Dialog open={openDesktop} onOpenChange={handleOpenChangeDesktop}>
                    <DialogTrigger asChild>
                        <Button size="lg" className="w-full">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Request Quote
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        {isSuccess ? (
                            <SuccessContent />
                        ) : (
                            <>
                                <DialogHeader>
                                    <DialogTitle>{tour.title}</DialogTitle>
                                    <DialogDescription>
                                        Request a custom quote tailored to your needs
                                    </DialogDescription>
                                </DialogHeader>
                                <FormContent />
                            </>
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            {/* Mobile Sheet */}
            <div className="md:hidden">
                <Sheet open={openMobile} onOpenChange={handleOpenChangeMobile}>
                    <SheetTrigger asChild>
                        <Button size="lg" className="w-full">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Request Quote
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
                        {isSuccess ? (
                            <SuccessContent />
                        ) : (
                            <>
                                <SheetHeader className="mb-6">
                                    <SheetTitle>{tour.title}</SheetTitle>
                                    <SheetDescription>
                                        Request a custom quote tailored to your needs
                                    </SheetDescription>
                                </SheetHeader>
                                <FormContent />
                            </>
                        )}
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
}