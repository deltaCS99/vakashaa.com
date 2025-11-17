// components/bookings/customer-bookings-table.tsx
"use client";

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
import { Eye, Calendar, MapPin, CheckCircle, AlertCircle, Star } from "lucide-react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import Link from "next/link";
import Image from "next/image";

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
}

interface CustomerBookingsTableProps {
    bookings: Booking[];
    type: "upcoming" | "past" | "pending";
}

export function CustomerBookingsTable({ bookings, type }: CustomerBookingsTableProps) {
    const getStatusBadge = (booking: Booking) => {
        if (booking.disputeReason) {
            return <Badge variant="destructive">Disputed</Badge>;
        }
        if (booking.tourConfirmedByCustomer) {
            return <Badge className="bg-green-600">Completed</Badge>;
        }
        if (booking.tourCompletedByOperator) {
            return (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Needs Confirmation
                </Badge>
            );
        }
        return <Badge variant="outline">Confirmed</Badge>;
    };

    const needsAction = (booking: Booking) => {
        return (
            booking.tourCompletedByOperator &&
            !booking.tourConfirmedByCustomer &&
            !booking.disputeReason
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
        <div className="space-y-4">
            {/* Desktop Table */}
            <div className="hidden md:block">
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tour</TableHead>
                                    <TableHead>Booking Ref</TableHead>
                                    <TableHead>Tour Dates</TableHead>
                                    <TableHead>Amount Paid</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bookings.map((booking) => (
                                    <TableRow key={booking.id} className={needsAction(booking) ? "bg-orange-50" : ""}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {booking.tour.images[0] && (
                                                    <div className="relative h-12 w-16 rounded overflow-hidden flex-shrink-0">
                                                        <Image
                                                            src={booking.tour.images[0]}
                                                            alt={booking.tour.title}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                )}
                                                <span className="font-medium">{booking.tour.title}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-mono text-sm">{booking.reference}</span>
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
                                        <TableCell>{getStatusBadge(booking)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/bookings/${booking.id}`}>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    {needsAction(booking) ? "Take Action" : "View"}
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
                {bookings.map((booking) => (
                    <Card
                        key={booking.id}
                        className={needsAction(booking) ? "border-orange-300 bg-orange-50" : ""}
                    >
                        <CardContent className="p-4">
                            {/* Tour Image & Title */}
                            <div className="flex gap-3 mb-3">
                                {booking.tour.images[0] && (
                                    <div className="relative h-16 w-20 rounded overflow-hidden flex-shrink-0">
                                        <Image
                                            src={booking.tour.images[0]}
                                            alt={booking.tour.title}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                                        {booking.tour.title}
                                    </h3>
                                    <p className="text-xs text-muted-foreground font-mono">{booking.reference}</p>
                                </div>
                            </div>

                            {/* Tour Dates */}
                            {booking.confirmedTourDate && booking.confirmedTourEndDate && (
                                <div className="flex items-center gap-2 text-sm mb-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                        {format(new Date(booking.confirmedTourDate), "MMM dd")} -{" "}
                                        {format(new Date(booking.confirmedTourEndDate), "MMM dd, yyyy")}
                                    </span>
                                </div>
                            )}

                            {/* Amount & Status */}
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-semibold">
                                    {booking.paidAmount
                                        ? `R${(booking.paidAmount / 100).toLocaleString("en-ZA")}`
                                        : "-"}
                                </span>
                                {getStatusBadge(booking)}
                            </div>

                            {/* Action Button */}
                            <Button variant="outline" size="sm" className="w-full" asChild>
                                <Link href={`/bookings/${booking.id}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    {needsAction(booking) ? "Take Action Required" : "View Details"}
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}