import { useState } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth, TEST_ACCOUNTS, getRedirectPath } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-800",
  admin: "bg-blue-100 text-blue-800",
  staff: "bg-orange-100 text-orange-800",
  artisan: "bg-green-100 text-green-800",
  customer: "bg-gray-100 text-gray-800",
};

export default function LoginPage() {
  const { login, loginAs } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) {
      const user = TEST_ACCOUNTS.find(u => u.email === email);
      const role = user?.role ?? "customer";
      setLocation(getRedirectPath(role));
    } else {
      toast({ title: "Login failed", description: "Invalid email or password.", variant: "destructive" });
    }
  };

  const handleQuickLogin = (account: typeof TEST_ACCOUNTS[0]) => {
    loginAs(account);
    setLocation(getRedirectPath(account.role));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold mx-auto mb-4">GG</div>
          <h1 className="font-serif text-3xl font-bold text-primary mb-1">Gorilla Guardians Village</h1>
          <p className="text-muted-foreground text-sm">Sign in to your account</p>
        </motion.div>

        {/* Login form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="shadow-lg border-border">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    data-testid="input-email"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    data-testid="input-password"
                    className="mt-1"
                  />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading} data-testid="button-submit-login">
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </form>

              <div className="mt-3 text-center">
                <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary underline transition-colors" data-testid="link-forgot-password">
                  Forgot password?
                </Link>
              </div>

              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowPanel(!showPanel)}
                  className="text-xs text-muted-foreground hover:text-primary underline transition-colors"
                  data-testid="button-toggle-test-accounts"
                >
                  {showPanel ? "Hide" : "Show"} test accounts
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Test accounts panel */}
        {showPanel && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 space-y-2">
            <p className="text-xs text-muted-foreground text-center mb-3">Click any account to sign in instantly:</p>
            {TEST_ACCOUNTS.map(account => (
              <Card
                key={account.email}
                className="cursor-pointer hover:shadow-md transition-shadow border-border hover:border-primary/30"
                onClick={() => handleQuickLogin(account)}
                data-testid={`card-test-account-${account.role}`}
              >
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{account.name}</div>
                    <div className="text-xs text-muted-foreground">{account.email}</div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${ROLE_COLORS[account.role]}`}>
                    {account.role.replace("_", " ")}
                  </span>
                </CardContent>
              </Card>
            ))}
            <p className="text-xs text-center text-muted-foreground">All test accounts use password: <span className="font-mono font-medium">admin123</span></p>
          </motion.div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          Don't have an account?{" "}
          <a href="/register" className="text-primary hover:underline">Create one</a>
        </p>
      </div>
    </div>
  );
}
