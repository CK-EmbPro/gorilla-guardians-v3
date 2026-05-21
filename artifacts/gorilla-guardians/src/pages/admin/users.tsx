import { useState } from "react";
import { Search, Edit, Shield, UserCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListUsers, useUpdateUser, getListUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { useAuth } from "@/lib/auth";

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-800",
  admin: "bg-blue-100 text-blue-800",
  staff: "bg-cyan-100 text-cyan-800",
  artisan: "bg-green-100 text-green-800",
  customer: "bg-gray-100 text-gray-700",
};

const demoUsers = [
  { id: 1, name: "Jean-Paul Habimana", email: "super_admin@gorillaguardians.rw", role: "super_admin", createdAt: "2024-01-01", isActive: true },
  { id: 2, name: "Marie Uwimana", email: "admin@gorillaguardians.rw", role: "admin", createdAt: "2024-01-02", isActive: true },
  { id: 3, name: "Emmanuel Nkurunziza", email: "staff@gorillaguardians.rw", role: "staff", createdAt: "2024-01-03", isActive: true },
  { id: 4, name: "Celestine Mukamana", email: "artisan@gorillaguardians.rw", role: "artisan", createdAt: "2024-02-10", isActive: true },
  { id: 5, name: "Sarah Johnson", email: "customer@gorillaguardians.rw", role: "customer", createdAt: "2024-03-15", isActive: true },
];

export default function AdminUsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editItem, setEditItem] = useState<any>(null);

  const { data: usersData, isLoading } = useListUsers({ role: roleFilter !== "all" ? roleFilter as any : undefined, search: search || undefined, limit: 100 });
  const updateUser = useUpdateUser();

  const users = Array.isArray(usersData) && usersData.length > 0 ? usersData : demoUsers;
  const filtered = users.filter((u: any) => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  const handleSave = () => {
    if (!editItem) return;
    updateUser.mutate({ id: editItem.id, data: { role: editItem.role } }, {
      onSuccess: () => {
        toast({ title: "User updated" });
        setEditItem(null);
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      },
    });
  };

  const canEditRole = (u: any) => currentUser?.role === "super_admin" || (currentUser?.role === "admin" && u.role !== "super_admin");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="font-serif text-2xl font-bold">Users</h1>
            <p className="text-sm text-muted-foreground">{filtered.length} registered users</p>
          </div>

          <div className="flex flex-wrap gap-3 mb-5">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {["super_admin","admin","staff","artisan","customer"].map(r => (
                  <SelectItem key={r} value={r} className="capitalize">{r.replace("_"," ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">{Array.from({length:5}).map((_,i)=><div key={i} className="h-14 bg-muted rounded-xl animate-pulse"/>)}</div>
          ) : (
            <Card className="border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u: any) => (
                      <tr key={u.id} className="border-b border-border hover:bg-muted/20 transition-colors" data-testid={`row-admin-user-${u.id}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">{u.name?.[0]}</div>
                            <span className="font-medium">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ROLE_COLORS[u.role] ?? "bg-muted"}`}>{u.role?.replace("_"," ")}</span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs flex items-center gap-1 ${u.isActive !== false ? "text-green-600" : "text-muted-foreground"}`}>
                            <UserCheck className="w-3 h-3" />{u.isActive !== false ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canEditRole(u) ? (
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditItem({ ...u })}>
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                          ) : (
                            <Shield className="w-4 h-4 text-muted-foreground/40 ml-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </main>

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User Role</DialogTitle></DialogHeader>
          {editItem && (
            <div className="py-4 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">{editItem.name?.[0]}</div>
                <div>
                  <div className="font-medium text-sm">{editItem.name}</div>
                  <div className="text-xs text-muted-foreground">{editItem.email}</div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={editItem.role} onValueChange={v => setEditItem((u: any) => ({ ...u, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {currentUser?.role === "super_admin" && <SelectItem value="super_admin">Super Admin</SelectItem>}
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="artisan">Artisan</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleSave} disabled={updateUser.isPending}>
              {updateUser.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
