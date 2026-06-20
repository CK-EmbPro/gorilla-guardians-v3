import { useState } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { ShoppingBag, Store, Eye, EyeOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth, getRedirectPath } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

type Role = "customer" | "artisan";

export default function RegisterPage() {
  const { register } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [role, setRole] = useState<Role>("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const validate = () => {
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = "This field is required.";
    if (!email.trim()) errs.email = "Email is required.";
    if (!password) errs.password = "Password is required.";
    else if (password.length < 6) errs.password = "Password must be at least 6 characters.";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    const ok = await register(name.trim(), email.trim(), password, role);
    setLoading(false);
    if (ok) {
      setLocation(getRedirectPath(role));
    } else {
      toast({ title: "Registration failed", description: "Email already in use or invalid details.", variant: "destructive" });
    }
  };

  const ROLE_CARDS: { value: Role; icon: React.ReactNode; label: string; subtitle: string }[] = [
    { value: "customer", icon: <ShoppingBag className="w-6 h-6" />, label: "Customer", subtitle: "Shop handcrafts" },
    { value: "artisan", icon: <Store className="w-6 h-6" />, label: "Artisan", subtitle: "List your crafts" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold mx-auto mb-4">GG</div>
          <h1 className="font-serif text-3xl font-bold text-primary mb-1">Gorilla Guardians HandCrafts</h1>
          <p className="text-muted-foreground text-sm">Create an account</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="shadow-lg border-border">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Role selector */}
                <div className="grid grid-cols-2 gap-3">
                  {ROLE_CARDS.map(({ value, icon, label, subtitle }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRole(value)}
                      className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl transition-colors text-center ${
                        role === value
                          ? "border-2 border-primary bg-primary/5 text-primary"
                          : "border border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {icon}
                      <span className="text-sm font-semibold">{label}</span>
                      <span className="text-xs opacity-75">{subtitle}</span>
                    </button>
                  ))}
                </div>

                {/* Name */}
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">
                    {role === "artisan" ? "Business / Shop Name" : "Full Name"} *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={role === "artisan" ? "e.g. Kigali Basket Weavers" : "Your full name"}
                    className="mt-1"
                  />
                  {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">Email address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-1"
                  />
                  {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="password" className="text-sm font-medium">Password *</Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
                </div>

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                  {loading ? "Creating account..." : role === "artisan" ? "Create Artisan Account" : "Create Account"}
                </Button>
              </form>

              <div className="mt-5 text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
                </p>
                <Link href="/" className="text-xs text-muted-foreground hover:text-primary transition-colors block">
                  Continue browsing without an account →
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
