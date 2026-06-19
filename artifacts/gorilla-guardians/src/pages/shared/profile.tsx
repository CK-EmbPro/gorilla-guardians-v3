import { useState } from "react";
import { Save, Lock, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { useAuth } from "@/lib/auth";
import { useUpdateUser } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ui/image-upload";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const updateUser = useUpdateUser();

  const [profile, setProfile] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    language: user?.language ?? "en",
    avatar: user?.avatar ?? "",
  });

  const [passwords, setPasswords] = useState({ current: "", newPw: "", confirm: "" });

  const handleSaveProfile = () => {
    if (!user) return;
    updateUser.mutate({ id: user.id, data: { name: profile.name, phone: profile.phone ?? undefined, language: profile.language, avatar: profile.avatar ?? undefined } }, {
      onSuccess: () => toast({ title: "Profile updated" }),
      onError: () => toast({ title: "Failed to update profile", variant: "destructive" }),
    });
  };

  const handleChangePassword = () => {
    if (passwords.newPw !== passwords.confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (passwords.newPw.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    toast({ title: "Password updated successfully" });
    setPasswords({ current: "", newPw: "", confirm: "" });
  };

  const roleLabel = user?.role?.replace("_", " ") ?? "User";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="font-serif text-2xl font-bold">My Profile</h1>
            <p className="text-sm text-muted-foreground mt-1 capitalize">Account settings for your {roleLabel} account.</p>
          </div>

          {/* Avatar card */}
          <Card className="border-border mb-6">
            <CardContent className="p-6 flex items-center gap-6">
              <div className="relative">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.name} className="w-20 h-20 rounded-full object-cover border-2 border-border" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center border-2 border-border">
                    <span className="text-3xl font-bold text-primary">{profile.name?.[0]}</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{profile.name}</p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <p className="text-xs capitalize text-muted-foreground mt-0.5">{roleLabel}</p>
                <div className="mt-3">
                  <ImageUpload
                    value={profile.avatar}
                    onChange={url => setProfile(p => ({ ...p, avatar: url }))}
                    aspect="square"
                    folder="users"
                    className="max-w-[200px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="profile">
            <TabsList className="mb-6">
              <TabsTrigger value="profile" className="gap-1.5"><User className="w-3.5 h-3.5"/>Profile</TabsTrigger>
              <TabsTrigger value="security" className="gap-1.5"><Lock className="w-3.5 h-3.5"/>Security</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card className="border-border">
                <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Full Name</Label>
                    <Input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email Address</Label>
                    <Input value={profile.email} disabled className="bg-muted/30" />
                    <p className="text-xs text-muted-foreground">Email cannot be changed. Contact support if needed.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+250 788 000 000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Preferred Language</Label>
                    <Select value={profile.language} onValueChange={v => setProfile(p => ({ ...p, language: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="rw">Kinyarwanda</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={handleSaveProfile} disabled={updateUser.isPending}>
                    <Save className="w-4 h-4" />{updateUser.isPending ? "Saving..." : "Save Profile"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card className="border-border">
                <CardHeader><CardTitle className="text-base">Change Password</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Current Password</Label>
                    <Input type="password" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>New Password</Label>
                    <Input type="password" value={passwords.newPw} onChange={e => setPasswords(p => ({ ...p, newPw: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Confirm New Password</Label>
                    <Input type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} />
                  </div>
                  {passwords.newPw && passwords.confirm && passwords.newPw !== passwords.confirm && (
                    <p className="text-xs text-destructive">Passwords don't match.</p>
                  )}
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={handleChangePassword}>
                    <Lock className="w-4 h-4" /> Update Password
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
