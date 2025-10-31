// components/admin/recent-activity.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { UserRound } from "lucide-react";

interface RecentActivityProps {
    activity: {
        operators: any[];
        quotes: any[];
        tours: any[];
        blogPosts: any[];
    };
}

export function RecentActivity({ activity }: RecentActivityProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="operators">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="operators">Operators</TabsTrigger>
                        <TabsTrigger value="quotes">Quotes</TabsTrigger>
                        <TabsTrigger value="tours">Tours</TabsTrigger>
                        <TabsTrigger value="blog">Blog</TabsTrigger>
                    </TabsList>

                    {/* Operators Tab */}
                    <TabsContent value="operators" className="space-y-4">
                        {activity.operators.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No recent operator applications
                            </p>
                        ) : (
                            activity.operators.map((operator) => (
                                <Link
                                    key={operator.id}
                                    href={`/admin/operators/${operator.id}`}
                                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <Avatar>
                                        <AvatarImage src={operator.user.image || ""} />
                                        <AvatarFallback>
                                            <UserRound className="h-4 w-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{operator.user.name}</p>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {operator.companyName}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={operator.isApproved ? "default" : "secondary"}>
                                            {operator.isApproved ? "Approved" : "Pending"}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(operator.createdAt), {
                                                addSuffix: true,
                                            })}
                                        </span>
                                    </div>
                                </Link>
                            ))
                        )}
                    </TabsContent>

                    {/* Quotes Tab */}
                    <TabsContent value="quotes" className="space-y-4">
                        {activity.quotes.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No recent quote requests
                            </p>
                        ) : (
                            activity.quotes.map((quote) => (
                                <Link
                                    key={quote.id}
                                    href={`/admin/quotes/${quote.id}`}
                                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{quote.tour.title}</p>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {quote.user.name} • {quote.user.email}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant={
                                                quote.status === "Pending"
                                                    ? "secondary"
                                                    : quote.status === "Quoted"
                                                        ? "default"
                                                        : "outline"
                                            }
                                        >
                                            {quote.status}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(quote.createdAt), {
                                                addSuffix: true,
                                            })}
                                        </span>
                                    </div>
                                </Link>
                            ))
                        )}
                    </TabsContent>

                    {/* Tours Tab */}
                    <TabsContent value="tours" className="space-y-4">
                        {activity.tours.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No recent tours
                            </p>
                        ) : (
                            activity.tours.map((tour) => (
                                <Link
                                    key={tour.id}
                                    href={`/admin/tours/${tour.id}`}
                                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{tour.title}</p>
                                        <p className="text-sm text-muted-foreground truncate">
                                            by {tour.operatorProfile.user.name}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={tour.isActive ? "default" : "secondary"}>
                                            {tour.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(tour.createdAt), {
                                                addSuffix: true,
                                            })}
                                        </span>
                                    </div>
                                </Link>
                            ))
                        )}
                    </TabsContent>

                    {/* Blog Tab */}
                    <TabsContent value="blog" className="space-y-4">
                        {activity.blogPosts.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No recent blog posts
                            </p>
                        ) : (
                            activity.blogPosts.map((post) => (
                                <Link
                                    key={post.id}
                                    href={`/admin/blog/${post.id}`}
                                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{post.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {post.publishedAt
                                                ? `Published ${formatDistanceToNow(
                                                    new Date(post.publishedAt),
                                                    { addSuffix: true }
                                                )}`
                                                : "Draft"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant={
                                                post.status === "Published" ? "default" : "secondary"
                                            }
                                        >
                                            {post.status}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(post.createdAt), {
                                                addSuffix: true,
                                            })}
                                        </span>
                                    </div>
                                </Link>
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}