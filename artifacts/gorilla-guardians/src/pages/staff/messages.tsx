import { useState, useRef, useEffect } from "react";
import { Send, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useListConversations, useListMessages, useSendMessage, getListMessagesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const demoConvs = [
  { id: 1, otherUser: { name: "Sarah Johnson", role: "customer" }, lastMessage: "My order hasn't arrived yet.", unreadCount: 3, updatedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
  { id: 2, otherUser: { name: "Celestine Mukamana", role: "artisan" }, lastMessage: "Stock update completed.", unreadCount: 0, updatedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString() },
  { id: 3, otherUser: { name: "James Lee", role: "customer" }, lastMessage: "Can I change my shipping address?", unreadCount: 1, updatedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString() },
];

export default function StaffMessagesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: conversations } = useListConversations();
  const [selectedConv, setSelectedConv] = useState<number | null>(null);
  const [text, setText] = useState("");
  const messagesEnd = useRef<HTMLDivElement>(null);

  const convList = Array.isArray(conversations) && conversations.length > 0 ? conversations : demoConvs;
  const { data: messages } = useListMessages({ conversationId: selectedConv ?? 0 }, { query: { enabled: !!selectedConv, queryKey: getListMessagesQueryKey({ conversationId: selectedConv ?? 0 }) } });
  const sendMessage = useSendMessage();
  const msgList = Array.isArray(messages) ? messages : [];

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [msgList.length]);

  const handleSend = () => {
    if (!text.trim() || !selectedConv) return;
    sendMessage.mutate({ data: { conversationId: selectedConv, content: text } }, {
      onSuccess: () => {
        setText("");
        queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey({ conversationId: selectedConv }) });
      },
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-hidden flex">
        <div className="w-72 border-r border-border overflow-y-auto">
          <div className="p-4 border-b border-border">
            <h1 className="font-serif text-lg font-bold">Messages</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Customer support</p>
          </div>
          {convList.map((conv: any) => (
            <button key={conv.id} onClick={() => setSelectedConv(conv.id)}
              className={cn("w-full text-left px-4 py-3 border-b border-border hover:bg-muted/40 transition-colors", selectedConv === conv.id && "bg-primary/5 border-r-2 border-r-primary")}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-medium text-sm">{conv.otherUser?.name}</span>
                {conv.unreadCount > 0 && <Badge className="bg-primary text-primary-foreground text-xs h-5 w-5 p-0 flex items-center justify-center">{conv.unreadCount}</Badge>}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">{conv.lastMessage}</p>
              <span className="text-[10px] text-muted-foreground/60 capitalize">{conv.otherUser?.role}</span>
            </button>
          ))}
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedConv ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {msgList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <MessageSquare className="w-10 h-10 mb-2 opacity-30" /><p className="text-sm">No messages yet.</p>
                  </div>
                ) : (
                  msgList.map((msg: any) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                        <div className={cn("max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm", isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm")}>
                          {msg.content}
                          <div className={cn("text-xs mt-1 opacity-60", isMe ? "text-right" : "")}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEnd} />
              </div>
              <div className="border-t border-border p-4 flex gap-3">
                <Input value={text} onChange={e => setText(e.target.value)} placeholder="Reply to customer..." onKeyDown={e => e.key === "Enter" && handleSend()} />
                <Button onClick={handleSend} disabled={sendMessage.isPending || !text.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground"><Send className="w-4 h-4" /></Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 mb-3 opacity-30" /><p>Select a conversation</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
