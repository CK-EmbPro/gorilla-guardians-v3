import { useState, useRef, useEffect, useCallback } from "react";
import { Send, MessageSquare, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useListConversations, useListMessages, useSendMessage, getListMessagesQueryKey, getListConversationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { useAuth } from "@/lib/auth";
import { useSSE } from "@/lib/useSSE";
import { cn } from "@/lib/utils";

function getOtherUser(conv: any, myId?: number) {
  if (conv.otherUser) return conv.otherUser;
  const other = conv.participants?.find((p: any) => p.id !== myId);
  return other ?? { name: "Unknown", role: "user" };
}

export default function ArtisanMessagesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: conversations, refetch: refetchConvs } = useListConversations();
  const [selectedConv, setSelectedConv] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const messagesEnd = useRef<HTMLDivElement>(null);

  const convList = Array.isArray(conversations) ? conversations : [];

  const { data: messages, refetch: refetchMsgs } = useListMessages(
    { conversationId: selectedConv ?? 0 },
    { query: { enabled: !!selectedConv, queryKey: getListMessagesQueryKey({ conversationId: selectedConv ?? 0 }) } }
  );
  const sendMessage = useSendMessage();
  const apiMessages = Array.isArray(messages) ? [...messages].reverse() : [];
  const allMessages = apiMessages.length > 0
    ? [...apiMessages, ...localMessages.filter(lm => !apiMessages.some((m: any) => m.id === lm.id))]
    : localMessages;

  useEffect(() => { setLocalMessages([]); }, [selectedConv]);
  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [allMessages.length]);

  const handleSSEEvent = useCallback((event: string, data: any) => {
    if (event === "message") {
      if (data.conversationId === selectedConv) {
        setLocalMessages(prev => {
          if (prev.some((m: any) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        setTimeout(() => refetchMsgs(), 500);
      }
      refetchConvs();
    }
  }, [selectedConv, refetchMsgs, refetchConvs]);

  useSSE(user?.id, handleSSEEvent);

  const handleSend = () => {
    if (!text.trim() || !selectedConv) return;
    const optimistic = {
      id: Date.now(), conversationId: selectedConv, senderId: user?.id,
      content: text, isRead: false, createdAt: new Date().toISOString(), fileUrl: null,
    };
    setLocalMessages(prev => [...prev, optimistic]);
    const sent = text;
    setText("");
    sendMessage.mutate(
      { data: { conversationId: selectedConv, content: sent } },
      {
        onSuccess: () => {
          setLocalMessages(prev => prev.filter(m => m.id !== optimistic.id));
          queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey({ conversationId: selectedConv }) });
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        },
      }
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-hidden flex">
        <div className="w-72 border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <h1 className="font-serif text-lg font-bold">Messages</h1>
          </div>
          <div className="flex-1 overflow-y-auto">
            {convList.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No conversations yet</p>
              </div>
            ) : (
              convList.map((conv: any) => {
                const other = getOtherUser(conv, user?.id);
                return (
                  <button key={conv.id} onClick={() => setSelectedConv(conv.id)}
                    className={cn("w-full text-left px-4 py-3 border-b border-border hover:bg-muted/40 transition-colors", selectedConv === conv.id && "bg-primary/5 border-r-2 border-r-primary")}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-medium text-sm truncate flex-1">{other?.name ?? "Unknown"}</span>
                      {conv.unreadCount > 0 && <Badge className="bg-primary text-primary-foreground text-xs h-5 min-w-5 px-1 flex items-center justify-center">{conv.unreadCount}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{conv.lastMessage ?? "Start a conversation"}</p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedConv ? (
            <>
              <div className="border-b border-border px-4 py-3 bg-muted/20">
                {(() => {
                  const conv = convList.find((c: any) => c.id === selectedConv);
                  const other = conv ? getOtherUser(conv, user?.id) : null;
                  return other ? (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-semibold">{other.name?.[0]}</div>
                      <div>
                        <p className="font-medium text-sm">{other.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{other.role?.replace("_", " ")}</p>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {allMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
                    <p className="text-sm">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  allMessages.map((msg: any) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                        <div className={cn("max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm", isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm")}>
                          {msg.content}
                          <div className={cn("text-xs mt-1 opacity-60", isMe ? "text-right" : "")}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEnd} />
              </div>
              <div className="border-t border-border p-4 flex gap-3">
                <Input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message..." onKeyDown={e => e.key === "Enter" && handleSend()} />
                <Button onClick={handleSend} disabled={sendMessage.isPending || !text.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
