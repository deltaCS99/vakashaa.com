// components/operator/operator-quote-response-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { respondToQuote } from "@/actions/operator/quotes";
import { toast } from "sonner";

interface InclusionExclusion {
  item: string;
  price: number | null; // In cents, null means included in base price
}

interface ExistingQuote {
  quotedPrice: number;
  quotedInclusions: InclusionExclusion[];
  quotedExclusions: InclusionExclusion[];
  quotedTerms: string;
  quoteValidityHours: number;
}

interface OperatorQuoteResponseFormProps {
  quoteRequestId: string;
  existingQuote?: ExistingQuote;
  isRevision?: boolean;
}

export function OperatorQuoteResponseForm({
  quoteRequestId,
  existingQuote,
  isRevision = false,
}: OperatorQuoteResponseFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [quotedPrice, setQuotedPrice] = useState(
    existingQuote ? (existingQuote.quotedPrice / 100).toString() : ""
  );
  const [inclusions, setInclusions] = useState<InclusionExclusion[]>(
    existingQuote?.quotedInclusions || [{ item: "", price: null }]
  );
  const [exclusions, setExclusions] = useState<InclusionExclusion[]>(
    existingQuote?.quotedExclusions || [{ item: "", price: null }]
  );
  const [terms, setTerms] = useState(existingQuote?.quotedTerms || "");
  const [validityHours, setValidityHours] = useState(
    existingQuote?.quoteValidityHours?.toString() || "72"
  );

  // Add inclusion
  const addInclusion = () => {
    setInclusions([...inclusions, { item: "", price: null }]);
  };

  // Remove inclusion
  const removeInclusion = (index: number) => {
    setInclusions(inclusions.filter((_, i) => i !== index));
  };

  // Update inclusion
  const updateInclusion = (index: number, field: keyof InclusionExclusion, value: any) => {
    const updated = [...inclusions];
    if (field === "price") {
      // Convert to cents or null
      updated[index][field] = value ? Math.round(parseFloat(value) * 100) : null;
    } else {
      updated[index][field] = value;
    }
    setInclusions(updated);
  };

  // Add exclusion
  const addExclusion = () => {
    setExclusions([...exclusions, { item: "", price: null }]);
  };

  // Remove exclusion
  const removeExclusion = (index: number) => {
    setExclusions(exclusions.filter((_, i) => i !== index));
  };

  // Update exclusion
  const updateExclusion = (index: number, field: keyof InclusionExclusion, value: any) => {
    const updated = [...exclusions];
    if (field === "price") {
      // Convert to cents or null
      updated[index][field] = value ? Math.round(parseFloat(value) * 100) : null;
    } else {
      updated[index][field] = value;
    }
    setExclusions(updated);
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!quotedPrice || parseFloat(quotedPrice) <= 0) {
      toast.error("Please enter a valid quoted price");
      return;
    }

    if (!validityHours || parseInt(validityHours) <= 0) {
      toast.error("Please enter a valid quote validity period");
      return;
    }

    // Filter out empty inclusions/exclusions
    const validInclusions = inclusions.filter((inc) => inc.item.trim() !== "");
    const validExclusions = exclusions.filter((exc) => exc.item.trim() !== "");

    setIsSubmitting(true);

    try {
      const result = await respondToQuote({
        quoteRequestId,
        quotedPrice: Math.round(parseFloat(quotedPrice) * 100), // Convert to cents
        quotedInclusions: validInclusions,
        quotedExclusions: validExclusions,
        quotedTerms: terms.trim() || undefined,
        quoteValidityHours: parseInt(validityHours),
      });

      if (result.success) {
        toast.success(isRevision ? "Quote updated successfully!" : "Quote sent successfully!");
        router.refresh();
      } else if (!result.success && "error" in result) {
        toast.error(result.error.message || "Failed to submit quote");
      }
    } catch (error) {
      console.error("Error submitting quote:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Quoted Price */}
      <div className="space-y-2">
        <Label htmlFor="quotedPrice">
          Total Quoted Price (ZAR) <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R</span>
          <Input
            id="quotedPrice"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={quotedPrice}
            onChange={(e) => setQuotedPrice(e.target.value)}
            className="pl-8"
            required
          />
        </div>
        <p className="text-xs text-gray-500">Enter the total price for this tour</p>
      </div>

      <Separator />

      {/* Inclusions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>What&apos;s Included</Label>
          <Button type="button" variant="outline" size="sm" onClick={addInclusion}>
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </Button>
        </div>
        <div className="space-y-2">
          {inclusions.map((inclusion, index) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-1">
                <Input
                  placeholder="e.g., Accommodation, Meals, Transportation"
                  value={inclusion.item}
                  onChange={(e) => updateInclusion(index, "item", e.target.value)}
                />
              </div>
              <div className="w-32">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Optional price"
                  value={inclusion.price ? (inclusion.price / 100).toString() : ""}
                  onChange={(e) => updateInclusion(index, "price", e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeInclusion(index)}
                disabled={inclusions.length === 1}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          Add optional prices for specific items, or leave blank if included in base price
        </p>
      </div>

      <Separator />

      {/* Exclusions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>What&apos;s Not Included</Label>
          <Button type="button" variant="outline" size="sm" onClick={addExclusion}>
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </Button>
        </div>
        <div className="space-y-2">
          {exclusions.map((exclusion, index) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-1">
                <Input
                  placeholder="e.g., Flights, Travel Insurance, Tips"
                  value={exclusion.item}
                  onChange={(e) => updateExclusion(index, "item", e.target.value)}
                />
              </div>
              <div className="w-32">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Est. cost"
                  value={exclusion.price ? (exclusion.price / 100).toString() : ""}
                  onChange={(e) => updateExclusion(index, "price", e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeExclusion(index)}
                disabled={exclusions.length === 1}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          Add estimated costs for excluded items to help customer budget
        </p>
      </div>

      <Separator />

      {/* Terms & Conditions */}
      <div className="space-y-2">
        <Label htmlFor="terms">Terms & Conditions</Label>
        <Textarea
          id="terms"
          placeholder="Enter your terms and conditions, payment terms, cancellation policy, etc."
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          rows={6}
          className="resize-none"
        />
        <p className="text-xs text-gray-500">Optional: Add specific terms for this quote</p>
      </div>

      <Separator />

      {/* Quote Validity */}
      <div className="space-y-2">
        <Label htmlFor="validity">
          Quote Valid For (Hours) <span className="text-red-500">*</span>
        </Label>
        <Input
          id="validity"
          type="number"
          min="1"
          placeholder="72"
          value={validityHours}
          onChange={(e) => setValidityHours(e.target.value)}
          required
        />
        <p className="text-xs text-gray-500">Default is 72 hours (3 days)</p>
      </div>

      {/* Submit Button */}
      <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {isRevision ? "Updating Quote..." : "Sending Quote..."}
          </>
        ) : (
          <>{isRevision ? "Update Quote" : "Send Quote to Customer"}</>
        )}
      </Button>

      {isRevision && (
        <p className="text-xs text-center text-gray-500">
          This will create a new revision and notify the customer
        </p>
      )}
    </form>
  );
}