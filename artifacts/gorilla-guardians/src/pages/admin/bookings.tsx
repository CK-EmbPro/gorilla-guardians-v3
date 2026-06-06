import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Calendar, Search, Users, DollarSign, Clock, CheckCircle2, XCircle,
  CalendarDays, List, Filter, UserCheck, Eye, Ticket, User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListBookings, useUpdateBooking, getListBookingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-blue-100 text-blue-800 border-blue-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  checked_in: "bg-purple-100 text-purple-800 border-purple-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  completed: "bg-gray-100 text-gray-700 border-gray-200",
};

const NEXT_STATUSES: Record<string, { label: string; value: string; color: string }[]> = {
  pending: [
    { label: "Approve", value: "approved", color: "bg-blue-600 hover:bg-blue-700 text-white" },
    { label: "Cancel", value: "cancelled", color: "bg-red-100 hover:bg-red-200 text-red-700 border border-red-200" },
  ],
  approved: [
    { label: "Confirm", value: "confirmed", color: "bg-green-600 hover:bg-green-700 text-white" },
    { label: "Cancel", value: "cancelled", color: "bg-red-100 hover:bg-red-200 text-red-700 border border-red-200" },
  ],
  confirmed: [
    { label: "Complete", value: "completed", color: "bg-gray-600 hover:bg-gray-700 text-white" },
    { label: "Cancel", value: "cancelled", color: "bg-red-100 hover:bg-red-200 text-red-700 border border-red-200" },
  ],
  checked_in: [
    { label: "Complete", value: "completed", color: "bg-gray-600 hover:bg-gray-700 text-white" },
  ],
  completed: [],
  cancelled: [],
};

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">{label}</span>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function MiniCalendar({ bookings }: { bookings: any[] }) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const bookingsByDay: Record<string, any[]> = {};
  bookings.forEach(b => {
    const d = b.date ? String(b.date).slice(0, 10) : null;
    if (d) {
      if (!bookingsByDay[d]) bookingsByDay[d] = [];
      bookingsByDay[d].push(b);
    }
  });

  const monthName = viewDate.toLocaleString("default", { month: "long", year: "numeric" });
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <Card className="border-border">
      <CardHeader className="pb-2 pt-4 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{monthName}</CardTitle>
          <div className="flex gap-1">
            <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground text-xs">‹</button>
            <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground text-xs">›</button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="grid grid-cols-7 text-center text-xs text-muted-foreground mb-1">
          {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => <div key={d} className="py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 text-center text-xs gap-y-0.5">
          {days.map((d, i) => {
            if (!d) return <div key={i} />;
            const key = `${year}-${pad(month+1)}-${pad(d)}`;
            const dayBookings = bookingsByDay[key] ?? [];
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
            return (
              <div key={i} className={`relative py-1.5 rounded-md ${isToday ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted"}`}>
                {d}
                {dayBookings.length > 0 && (
                  <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {dayBookings.slice(0, 3).map((_, bi) => (
                      <div key={bi} className={`w-1 h-1 rounded-full ${isToday ? "bg-primary-foreground" : "bg-primary"}`} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminBookingsPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState<"list" | "calendar">("list");
  const [checkingInId, setCheckingInId] = useState<number | null>(null);
  const [assigningGuideId, setAssigningGuideId] = useState<number | null>(null);

  const { data: bookingsData, isLoading } = useListBookings({});
  const updateBooking = useUpdateBooking();

  const { data: guides = [] } = useQuery<any[]>({
    queryKey: ["guides"],
    queryFn: async () => {
      const res = await fetch("/api/guides", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const allBookings = Array.isArray(bookingsData) ? bookingsData : [];

  const filtered = useMemo(() => {
    return allBookings.filter((b: any) => {
      const matchStatus = statusFilter === "all" || b.status === statusFilter;
      const q = search.toLowerCase();
      const matchSearch = !q ||
        b.user?.name?.toLowerCase().includes(q) ||
        b.user?.email?.toLowerCase().includes(q) ||
        b.experience?.title?.toLowerCase().includes(q) ||
        String(b.id).includes(q) ||
        (b.bookingReference ?? "").toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [allBookings, search, statusFilter]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: allBookings.length,
      pending: allBookings.filter((b: any) => b.status === "pending").length,
      confirmed: allBookings.filter((b: any) => b.status === "confirmed" || b.status === "approved").length,
      checkedIn: allBookings.filter((b: any) => b.status === "checked_in").length,
      today: allBookings.filter((b: any) => b.date === today || (b.date && String(b.date).startsWith(today))).length,
      revenue: allBookings.filter((b: any) => b.status !== "cancelled").reduce((s: number, b: any) => s + (b.totalAmount ?? 0), 0),
    };
  }, [allBookings]);

  const handleStatus = (id: number, status: string) => {
    updateBooking.mutate({ id, data: { status } as any }, {
      onSuccess: () => {
        toast({ title: `Booking ${status.replace("_", " ")}` });
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
      },
      onError: () => toast({ title: "Failed to update", variant: "destructive" }),
    });
  };

  const handleCheckin = async (id: number) => {
    setCheckingInId(id);
    try {
      const res = await fetch(`/api/bookings/${id}/checkin`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.status === 409) {
        toast({ title: "Already checked in", description: `Checked in at ${new Date(data.checkinAt).toLocaleString()}` });
      } else if (!res.ok) {
        toast({ title: data.error ?? "Check-in failed", variant: "destructive" });
      } else {
        toast({ title: "✓ Visitor checked in successfully!" });
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setCheckingInId(null);
    }
  };

  const handleAssignGuide = async (bookingId: number, guideId: number | null) => {
    setAssigningGuideId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/guide`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ guideId }),
      });
      if (!res.ok) throw new Error("Failed to assign guide");
      toast({ title: guideId ? "Guide assigned" : "Guide unassigned" });
      queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
    } catch {
      toast({ title: "Failed to assign guide", variant: "destructive" });
    } finally {
      setAssigningGuideId(null);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="font-serif text-2xl font-bold">Bookings</h1>
              <p className="text-sm text-muted-foreground">{allBookings.length} total bookings</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setLocation("/booking-verify")} className="gap-1.5">
                <UserCheck className="w-3.5 h-3.5" /> Verify QR
              </Button>
              <Button size="sm" variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")} className="gap-1.5">
                <List className="w-3.5 h-3.5" /> List
              </Button>
              <Button size="sm" variant={view === "calendar" ? "default" : "outline"} onClick={() => setView("calendar")} className="gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" /> Calendar
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <StatCard icon={Calendar} label="Total" value={stats.total} color="bg-primary/10 text-primary" />
            <StatCard icon={Clock} label="Pending" value={stats.pending} sub="Awaiting action" color="bg-yellow-100 text-yellow-700" />
            <StatCard icon={CheckCircle2} label="Confirmed" value={stats.confirmed} sub="Approved/confirmed" color="bg-green-100 text-green-700" />
            <StatCard icon={UserCheck} label="Checked In" value={stats.checkedIn} color="bg-purple-100 text-purple-700" />
            <StatCard icon={Users} label="Today" value={stats.today} sub="Bookings today" color="bg-blue-100 text-blue-700" />
            <StatCard icon={DollarSign} label="Revenue" value={`$${stats.revenue.toLocaleString()}`} sub="Excl. cancelled" color="bg-accent/20 text-accent-foreground" />
          </div>

          {view === "calendar" ? (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1"><MiniCalendar bookings={allBookings} /></div>
              <div className="lg:col-span-2">
                <Card className="border-border">
                  <CardHeader className="pb-3"><CardTitle className="text-sm">Upcoming Bookings</CardTitle></CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2 max-h-[500px] overflow-y-auto">
                    {allBookings
                      .filter((b: any) => b.date >= new Date().toISOString().slice(0, 10) && b.status !== "cancelled")
                      .sort((a: any, b: any) => String(a.date).localeCompare(String(b.date)))
                      .slice(0, 20)
                      .map((b: any) => (
                        <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 text-sm">
                          <div>
                            <div className="font-medium">{b.experience?.title ?? `Booking #${b.id}`}</div>
                            <div className="text-muted-foreground text-xs">
                              {b.user?.name ?? "Guest"} · {b.date} · {b.participants} pax
                              {b.bookingReference && <> · <code className="font-mono text-primary">{b.bookingReference}</code></>}
                            </div>
                          </div>
                          <Badge className={`capitalize text-xs border ${STATUS_COLORS[b.status] ?? "bg-muted"}`}>{b.status.replace("_", " ")}</Badge>
                        </div>
                      ))}
                    {allBookings.filter((b: any) => b.date >= new Date().toISOString().slice(0, 10) && b.status !== "cancelled").length === 0 && (
                      <p className="text-muted-foreground text-sm text-center py-8">No upcoming bookings</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-3 mb-5">
                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search by customer, experience, reference, or booking ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-44">
                    <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="checked_in">Checked In</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isLoading ? (
                <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>{search || statusFilter !== "all" ? "No bookings match your filters." : "No bookings yet."}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((b: any) => (
                    <Card key={b.id} className="border-border" data-testid={`card-booking-${b.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-2 mb-1.5">
                              <span className="font-semibold text-sm">{b.experience?.title ?? `Booking #${b.id}`}</span>
                              <Badge className={`capitalize text-xs border ${STATUS_COLORS[b.status] ?? "bg-muted"}`} data-testid={`badge-status-${b.id}`}>
                                {b.status.replace("_", " ")}
                              </Badge>
                              {b.bookingReference && (
                                <code className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                  {b.bookingReference}
                                </code>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{b.user?.name ?? "Guest"} ({b.user?.email ?? ""})</span>
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{b.date}</span>
                              <span>{b.participants} participant{b.participants !== 1 ? "s" : ""}</span>
                              <span className="font-medium text-foreground">${b.totalAmount}</span>
                              <span className={`px-1.5 py-0.5 rounded text-xs ${b.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                Payment: {b.paymentStatus}
                              </span>
                            </div>
                            {b.guide && (
                              <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                                <User className="w-3 h-3 text-primary" />
                                <span className="font-medium">Guide:</span> {b.guide.name}
                              </div>
                            )}
                            {b.checkinAt && (
                              <div className="text-xs text-purple-700 mt-1">
                                ✓ Checked in: {new Date(b.checkinAt).toLocaleString()}
                              </div>
                            )}
                            {b.specialRequests && (
                              <p className="text-xs text-muted-foreground mt-1.5 bg-muted/50 px-2 py-1 rounded">Note: {b.specialRequests}</p>
                            )}

                            {/* Guide Assignment */}
                            <div className="mt-2 flex items-center gap-2">
                              <User className="w-3 h-3 text-muted-foreground shrink-0" />
                              <select
                                value={b.guideId ?? ""}
                                onChange={e => handleAssignGuide(b.id, e.target.value ? Number(e.target.value) : null)}
                                disabled={assigningGuideId === b.id}
                                className="text-xs px-2 py-1 rounded border border-input bg-background text-muted-foreground"
                              >
                                <option value="">Assign guide...</option>
                                {(guides as any[]).filter((g: any) => g.available || g.id === b.guideId).map((g: any) => (
                                  <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-1.5 shrink-0 flex-wrap justify-end items-start">
                            <button
                              onClick={() => setLocation(`/bookings/${b.id}`)}
                              className="text-xs px-2.5 py-1.5 rounded-md font-medium border border-border hover:bg-muted transition-colors"
                              title="View details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setLocation(`/booking-ticket/${b.id}`)}
                              className="text-xs px-2.5 py-1.5 rounded-md font-medium border border-primary/30 text-primary hover:bg-primary/5 transition-colors"
                              title="View ticket"
                            >
                              <Ticket className="w-3.5 h-3.5" />
                            </button>
                            {(b.status === "approved" || b.status === "confirmed") && !b.checkinAt && (
                              <button
                                onClick={() => handleCheckin(b.id)}
                                disabled={checkingInId === b.id}
                                className="text-xs px-2.5 py-1.5 rounded-md font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors flex items-center gap-1 disabled:opacity-60"
                              >
                                <UserCheck className="w-3 h-3" /> {checkingInId === b.id ? "..." : "Check In"}
                              </button>
                            )}
                            {(NEXT_STATUSES[b.status] ?? []).map(action => (
                              <button
                                key={action.value}
                                onClick={() => handleStatus(b.id, action.value)}
                                disabled={updateBooking.isPending}
                                className={`text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors ${action.color}`}
                                data-testid={`button-${action.value}-${b.id}`}
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
