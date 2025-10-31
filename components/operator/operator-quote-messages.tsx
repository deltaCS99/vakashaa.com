// components/operator/operator-quote-messages.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Send, User, Building2, Loader2 } from "lucide-react";
import { sendOperatorMessage } from "@/actions/operator/quotes";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Message {
  id: string;
  message: string;
  senderId: string;
  senderType: string; // "customer" or "operator"
  createdAt: Date;
}

interface OperatorQuoteMessagesProps {
  quoteRequestId: string;
  messages: Message[];
  currentUserId: string;
}

export function OperatorQuoteMessages({
  quoteRequestId,
  messages,
  currentUserId,
}: OperatorQuoteMessagesProps) {
  const router = useRouter();
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) {
      return;
    }

    setIsSending(true);

    try {
      const result = await sendOperatorMessage(quoteRequestId, newMessage.trim());

      if (result.success) {
        setNewMessage("");
        toast.success("Message sent");
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

  // Empty state
  if (messages.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No messages yet</p>
          <p className="text-xs mt-1">Start a conversation with the customer</p>
        </div>
        <Separator />

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="space-y-3">
          <Textarea
            placeholder="Type your message to the customer..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            rows={3}
            disabled={isSending}
            className="resize-none"
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="w-full"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Messages List */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {messages.map((message) => {
          const isOperator = message.senderType === "operator";
          const isCurrentUser = message.senderId === currentUserId;

          return (
            <div
              key={message.id}
              className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className={isOperator ? "bg-gray-100" : "bg-blue-100"}>
                  {isOperator ? (
                    <Building2 className="h-4 w-4 text-gray-600" />
                  ) : (
                    <User className="h-4 w-4 text-blue-600" />
                  )}
                </AvatarFallback>
              </Avatar>

              {/* Message Bubble */}
              <div className={`flex-1 max-w-[70%] ${isCurrentUser ? "items-end" : "items-start"}`}>
                <div
                  className={`rounded-lg px-4 py-2 ${
                    isCurrentUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {/* Sender Label */}
                  <p
                    className={`text-xs font-medium mb-1 ${
                      isCurrentUser ? "text-primary-foreground/80" : "text-gray-600"
                    }`}
                  >
                    {isOperator ? "You" : "Customer"}
                  </p>

                  {/* Message Text */}
                  <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>

                  {/* Timestamp */}
                  <p
                    className={`text-xs mt-1 ${
                      isCurrentUser ? "text-primary-foreground/60" : "text-gray-500"
                    }`}
                  >
                    {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <Separator />

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="space-y-3">
        <Textarea
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          rows={3}
          disabled={isSending}
          className="resize-none"
          onKeyDown={(e) => {
            // Send on Ctrl+Enter or Cmd+Enter
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault();
              handleSendMessage(e);
            }
          }}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">Press Ctrl+Enter to send</p>
          <Button type="submit" disabled={!newMessage.trim() || isSending}>
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}