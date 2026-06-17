import { useState, useEffect } from "react";
import { Mail, RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle, Send, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

interface EmailLog {
  id: number;
  userId: number | null;
  toEmail: string;
  toName: string | null;
  subject: string;
  template: string;
  status: string;
  provider: string | null;
  providerId: string | null;
  errorMessage: string | null;
  metadata: string | null;
  sentAt: string | null;
  createdAt: string;
}

interface EmailStats {
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  pending: number;
  resendConfigured: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  sent: { label: "Sent", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2 },
  failed: { label: "Failed", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
  skipped: { label: "Skipped", color: "bg-gray-100 text-gray-700 border-gray-200", icon: AlertCircle },
};

export default function AdminEmailLogs() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const { toast } = useToast();

  async function fetchLogs() {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        fetch(`${BASE}/api/emails/logs?limit=100`, { credentials: "include" }),
        fetch(`${BASE}/api/emails/stats`, { credentials: "include" }),
      ]);
      if (logsRes.ok) setLogs(await logsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch {
      toast({ title: "Failed to load email logs", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLogs(); }, []);

  async function handleResend(id: number) {
    setResendingId(id);
    try {
      const res = await fetch(`${BASE}/api/emails/resend/${id}`, { method: "POST", credentials: "include" });
      if (res.ok) {
        toast({ title: "Resend queued", description: "The email will be retried shortly." });
        setTimeout(fetchLogs, 2000);
      } else {
        toast({ title: "Failed to resend", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to resend", variant: "destructive" });
    } finally {
      setResendingId(null);
    }
  }

  const statCards = stats ? [
    { label: "Total Emails", value: stats.total, icon: Mail, color: "text-primary" },
    { label: "Sent", value: stats.sent, icon: CheckCircle2, color: "text-green-600" },
    { label: "Failed", value: stats.failed, icon: XCircle, color: "text-red-500" },
    { label: "Skipped (no API key)", value: stats.skipped, icon: AlertCircle, color: "text-gray-500" },
  ] : [];

  const deliveryStatusBadge = stats ? (
    stats.resendConfigured
      ? { label: "Email Delivery: Enabled", className: "bg-green-100 text-green-800 border-green-200" }
      : { label: "Email Delivery: Disabled", className: "bg-amber-100 text-amber-800 border-amber-200" }
  ) : null;

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-serif text-3xl font-bold flex items-center gap-3">
                <Mail className="w-7 h-7 text-primary" /> Email Logs
                {deliveryStatusBadge && (
                  <Badge className={cn("text-xs border font-medium", deliveryStatusBadge.className)}>
                    {deliveryStatusBadge.label}
                  </Badge>
                )}
              </h1>
              <p className="text-muted-foreground mt-1">Monitor email delivery and resend failed messages.</p>
            </div>
            <Button variant="outline" onClick={fetchLogs} disabled={loading} className="gap-2">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {statCards.map(({ label, value, icon: Icon, color }) => (
                <Card key={label}>
                  <CardContent className="p-5 flex items-center gap-3">
                    <Icon className={cn("w-8 h-8", color)} />
                    <div>
                      <div className="text-2xl font-bold">{value}</div>
                      <div className="text-xs text-muted-foreground">{label}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Notice about Resend */}
          {stats && !stats.resendConfigured && (
            <Card className="mb-6 border-amber-200 bg-amber-50/60">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900 text-sm">Email Sending Disabled</p>
                  <p className="text-amber-700 text-xs mt-1">
                    No <code className="bg-amber-100 px-1 rounded">RESEND_API_KEY</code> is configured. Emails are being logged but not delivered.
                    Add your Resend API key to the environment secrets to enable real email delivery.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Logs table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Send className="w-4 h-4 text-primary" /> Email History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading logs...
                </div>
              ) : logs.length === 0 ? (
                <div className="p-12 text-center">
                  <Mail className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No email logs yet. Emails will appear here once bookings, orders, or registrations occur.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {logs.map(log => {
                    const cfg = STATUS_CONFIG[log.status] ?? STATUS_CONFIG.pending;
                    const Icon = cfg.icon;
                    return (
                      <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", log.status === "sent" ? "bg-green-100" : log.status === "failed" ? "bg-red-100" : "bg-gray-100")}>
                          <Icon className={cn("w-4 h-4", log.status === "sent" ? "text-green-600" : log.status === "failed" ? "text-red-500" : "text-gray-500")} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm truncate">{log.subject}</span>
                            <Badge className={cn("text-xs border shrink-0", cfg.color)}>{cfg.label}</Badge>
                            <Badge variant="outline" className="text-xs shrink-0">{log.template}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            To: <span className="font-medium">{log.toName ? `${log.toName} <${log.toEmail}>` : log.toEmail}</span>
                          </div>
                          {log.errorMessage && (
                            <div className="text-xs text-red-600 mt-1 bg-red-50 rounded px-2 py-1">
                              Error: {log.errorMessage}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground/60 mt-0.5">
                            {new Date(log.createdAt).toLocaleString()}
                            {log.sentAt && ` · Sent ${new Date(log.sentAt).toLocaleString()}`}
                            {log.providerId && ` · ID: ${log.providerId}`}
                          </div>
                        </div>
                        {(log.status === "failed" || log.status === "skipped") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResend(log.id)}
                            disabled={resendingId === log.id}
                            className="shrink-0"
                          >
                            {resendingId === log.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3.5 h-3.5" />
                            )}
                            <span className="ml-1.5">Resend</span>
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
