// components/operator/operator-dashboard-stats.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package,
  MessageSquareQuote,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Plus,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface DashboardStatsProps {
  stats: {
    totalTours: number;
    activeTours: number;
    inactiveTours: number;
    totalQuotes: number;
    pendingQuotes: number;
    quotedQuotes: number;
    acceptedQuotes: number;
    confirmedBookings: number;
    acceptanceRate: number;
    totalRevenue: number;
  };
}

export function OperatorDashboardStats({ stats }: DashboardStatsProps) {
  return (
    <>
      {/* Main Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Total Tours */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Tours</CardTitle>
            <Package className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTours}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.activeTours} active, {stats.inactiveTours} inactive
            </p>
          </CardContent>
        </Card>

        {/* Total Quotes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Quote Requests</CardTitle>
            <MessageSquareQuote className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuotes}</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        {/* Pending Quotes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Needs Response</CardTitle>
            <AlertCircle className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingQuotes}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting your quote</p>
            {stats.pendingQuotes > 0 && (
              <Link href="/operator/quotes?status=Pending">
                <Button variant="link" size="sm" className="px-0 mt-2 h-auto">
                  Respond now <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Confirmed Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Confirmed</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.confirmedBookings}</div>
            <p className="text-xs text-gray-500 mt-1">Paid bookings</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        {/* Acceptance Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Quote Acceptance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">{stats.acceptanceRate}%</div>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.acceptedQuotes} of {stats.quotedQuotes} quotes accepted
            </p>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <div className="text-2xl font-bold">
                R{((stats.totalRevenue || 0) / 100).toLocaleString("en-ZA")}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">From confirmed bookings</p>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/operator/tours">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />
                Create New Tour
              </Button>
            </Link>
            {stats.pendingQuotes > 0 && (
              <Link href="/operator/quotes?status=Pending">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  View Pending ({stats.pendingQuotes})
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}