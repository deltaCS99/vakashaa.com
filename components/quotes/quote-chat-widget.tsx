// components/quotes/quote-chat-widget.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, User, Building2, Loader2 } from "lucide-react";
import { sendQuoteMessage, markQuoteMessagesAsRead } from "@/actions/quote-requests";
import { sendOperatorMessage, markOperatorQuoteMessagesAsRead } from "@/actions/operator/quotes";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Message {
    id: string;
    message: string;
    senderId: string;
    senderType: string;
    readAt: Date | null; // ✅ Add readAt
    createdAt: Date;
}

interface QuoteChatWidgetProps {
    quoteRequestId: string;
    messages: Message[];
    currentUserId: string;
    userRole?: "customer" | "operator";
}

export function QuoteChatWidget({
    quoteRequestId,
    messages,
    currentUserId,
    userRole = "customer",
}: QuoteChatWidgetProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // ✅ Mark messages as read when chat opens
    useEffect(() => {
        if (isOpen) {
            const markAsRead = async () => {
                try {
                    if (userRole === "operator") {
                        await markOperatorQuoteMessagesAsRead(quoteRequestId);
                    } else {
                        await markQuoteMessagesAsRead(quoteRequestId);
                    }
                    router.refresh(); // Refresh to update unread count
                } catch (error) {
                    console.error("Error marking messages as read:", error);
                }
            };

            markAsRead();
        }
    }, [isOpen, quoteRequestId, userRole, router]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newMessage.trim()) {
            return;
        }

        setIsSending(true);

        try {
            const result = userRole === "operator"
                ? await sendOperatorMessage(quoteRequestId, newMessage.trim())
                : await sendQuoteMessage(quoteRequestId, newMessage.trim());

            if (result.success) {
                setNewMessage("");
                router.refresh();
            } else if (!result.success && "error" in result) {
                toast.error(result.error.message || "Failed to send message");
            }
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsSending(false);
        }
    };

    // ✅ Count ONLY unread messages from other party
    const unreadCount = messages.filter((m) => {
        if (userRole === "customer") {
            // Customer: count unread messages from operator
            return m.senderType === "operator" && m.readAt === null;
        } else {
            // Operator: count unread messages from customer
            return m.senderType === "customer" && m.readAt === null;
        }
    }).length;

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-20 md:bottom-6 right-6 bg-primary hover:bg-primary/90 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110 z-40"
            >
                <MessageSquare className="w-6 h-6" />
                {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                        {unreadCount}
                    </Badge>
                )}
            </button>

            {/* Chat Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col p-0">
                    <DialogHeader className="p-4 pb-3 border-b">
                        <DialogTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            {userRole === "operator" ? "Chat with Customer" : "Chat with Operator"}
                        </DialogTitle>
                    </DialogHeader>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px]">
                        {messages.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p className="text-sm">No messages yet</p>
                                <p className="text-xs mt-1">Start a conversation</p>
                            </div>
                        ) : (
                            messages.map((message) => {
                                const isCustomer = message.senderType === "customer";
                                const isCurrentUser = message.senderId === currentUserId;

                                return (
                                    <div
                                        key={message.id}
                                        className={`flex gap-2 ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}
                                    >
                                        <Avatar className="h-7 w-7 flex-shrink-0">
                                            <AvatarFallback className={isCustomer ? "bg-blue-100" : "bg-gray-100"}>
                                                {isCustomer ? (
                                                    <User className="h-3 w-3 text-blue-600" />
                                                ) : (
                                                    <Building2 className="h-3 w-3 text-gray-600" />
                                                )}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className={`flex-1 max-w-[75%]`}>
                                            <div
                                                className={`rounded-lg px-3 py-2 ${isCurrentUser
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-gray-100 text-gray-900"
                                                    }`}
                                            >
                                                <p className="text-sm whitespace-pre-wrap break-words">
                                                    {message.message}
                                                </p>
                                                <p
                                                    className={`text-xs mt-1 ${isCurrentUser ? "text-primary-foreground/60" : "text-gray-500"
                                                        }`}
                                                >
                                                    {formatDistanceToNow(new Date(message.createdAt), {
                                                        addSuffix: true,
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <form onSubmit={handleSendMessage} className="p-4 border-t space-y-2">
                        <Textarea
                            placeholder="Type your message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            rows={2}
                            disabled={isSending}
                            className="resize-none text-sm"
                            onKeyDown={(e) => {
                                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                                    e.preventDefault();
                                    handleSendMessage(e);
                                }
                            }}
                        />
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">Ctrl+Enter to send</p>
                            <Button type="submit" size="sm" disabled={!newMessage.trim() || isSending}>
                                {isSending ? (
                                    <>
                                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-3 h-3 mr-2" />
                                        Send
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}