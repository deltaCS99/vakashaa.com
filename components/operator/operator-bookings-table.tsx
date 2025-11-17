// components/operator/operator-bookings-table.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Eye, Loader2, Calendar, Users, Mail, Phone } from "lucide-react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import Link from "next/link";
import { markTourComplete } from "@/actions/operator/bookings";
import { toast } from "sonner";

interface Booking {
    id: string;
    reference: string;
    confirmedTourDate: Date | null;
    confirmedTourEndDate: Date | null;
    paidAmount: number | null;
    tourCompletedByOperator: boolean | null;
    tourCompletedAt: Date | null;
    tourConfirmedByCustomer: boolean | null;
    disputeReason: string | null;
    tour: {
        id: string;
        title: string;
        images: string[];
    };
    user: {
        name: string | null;
        email: string | null;
        phone: string | null;
        whatsappNumber: string | null;
    };
}

interface OperatorBookingsTableProps {
    bookings: Booking[];
    type: "upcoming" | "past" | "pending";
}

export function OperatorBookingsTable({ bookings, type }: OperatorBookingsTableProps) {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);

    const handleMarkComplete = async (bookingId: string) => {
        setLoading(bookingId);
        const result = await markTourComplete(bookingId);
        setLoading(null);

        if (result.success) {
            toast.success("Tour marked as complete! Customer will be notified.");
            router.refresh();
        } else {
            toast.error(result.error?.message || "Failed to mark tour complete");
        }
    };

    const canMarkComplete = (booking: Booking) => {
        return (
            booking.confirmedTourEndDate &&
            isPast(new Date(booking.confirmedTourEndDate)) &&
            !booking.tourCompletedByOperator
        );
    };

    if (bookings.length === 0) {
        return (
            <Card>
                <CardContent className="p-12 text-center">
                    <p className="text-gray-600">No {type} bookings</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Booking</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Tour Dates</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bookings.map((booking) => (
                            <TableRow key={booking.id}>
                                <TableCell>
                                    <div>
                                        <p className="font-medium">{booking.tour.title}</p>
                                        <p className="text-sm text-muted-foreground font-mono">
                                            {booking.reference}
                                        </p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div>
                                        <p className="font-medium">{booking.user.name}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Mail className="h-3 w-3" />
                                            {booking.user.email}
                                        </div>
                                        {booking.user.phone && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Phone className="h-3 w-3" />
                                                {booking.user.phone}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {booking.confirmedTourDate && booking.confirmedTourEndDate ? (
                                        <div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <span>
                                                    {format(new Date(booking.confirmedTourDate), "MMM dd")} -{" "}
                                                    {format(new Date(booking.confirmedTourEndDate), "MMM dd, yyyy")}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {type === "upcoming"
                                                    ? `Starts ${formatDistanceToNow(new Date(booking.confirmedTourDate), {
                                                        addSuffix: true,
                                                    })}`
                                                    : `Ended ${formatDistanceToNow(new Date(booking.confirmedTourEndDate), {
                                                        addSuffix: true,
                                                    })}`}
                                            </p>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">No dates set</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {booking.paidAmount ? (
                                        <span className="font-semibold">
                                            R{(booking.paidAmount / 100).toLocaleString("en-ZA")}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {booking.disputeReason ? (
                                        <Badge variant="destructive">Disputed</Badge>
                                    ) : booking.tourConfirmedByCustomer ? (
                                        <Badge className="bg-green-600">Confirmed</Badge>
                                    ) : booking.tourCompletedByOperator ? (
                                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                            Awaiting Confirmation
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline">Active</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/operator/bookings/${booking.id}`}>
                                                <Eye className="h-4 w-4 mr-2" />
                                                View
                                            </Link>
                                        </Button>
                                        {canMarkComplete(booking) && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleMarkComplete(booking.id)}
                                                disabled={loading === booking.id}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                {loading === booking.id ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Marking...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="h-4 w-4 mr-2" />
                                                        Mark Complete
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}