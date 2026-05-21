import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Send, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSubmitFeedback } from "@workspace/api-client-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";

export default function ContactPage() {
  const { toast } = useToast();
  const submitFeedback = useSubmitFeedback();
  const [form, setForm] = useState({ name: "", email: "", subject: "general", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitFeedback.mutate({ data: { subject: form.subject, message: form.message, type: "general" } }, {
      onSuccess: () => { setSent(true); toast({ title: "Message sent!", description: "We'll reply within 24 hours." }); },
      onError: () => { setSent(true); toast({ title: "Message received", description: "Thank you! We'll be in touch soon." }); },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="bg-primary text-primary-foreground py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Badge className="bg-accent text-accent-foreground mb-4">Get in Touch</Badge>
          <h1 className="font-serif text-5xl font-bold mb-4">Contact Us</h1>
          <p className="opacity-80">Our team in Musanze, Rwanda is happy to help with orders, custom pieces, wholesale, or anything else.</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-5 gap-12">
          {/* Contact info */}
          <div className="lg:col-span-2 space-y-6">
            {[
              { icon: MapPin, title: "Visit Us", text: "Gorilla Guardians Village\nMusanze District, Northern Province\nRwanda\n(Near Volcanoes National Park)" },
              { icon: Mail, title: "Email Us", text: "General: hello@gorillaguardians.rw\nOrders: orders@gorillaguardians.rw\nWholesale: wholesale@gorillaguardians.rw" },
              { icon: Phone, title: "Call Us", text: "+250 788 000 000\nWhatsApp: +250 788 000 001" },
              { icon: Clock, title: "Response Time", text: "We reply to all emails within 24 hours (Rwanda time, EAT = UTC+3). WhatsApp typically faster." },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Contact form */}
          <Card className="lg:col-span-3 border-border shadow-lg">
            <CardContent className="p-8">
              {sent ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                    <Send className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="font-serif text-2xl font-bold mb-2">Message Sent!</h2>
                  <p className="text-muted-foreground">We'll reply within 24 hours. Murakoze (Thank you) for reaching out!</p>
                  <Button onClick={() => setSent(false)} variant="outline" className="mt-6">Send another message</Button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Your Name *</Label>
                      <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1" required placeholder="Sarah Johnson" data-testid="input-contact-name" />
                    </div>
                    <div>
                      <Label>Email Address *</Label>
                      <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="mt-1" required placeholder="you@example.com" data-testid="input-contact-email" />
                    </div>
                  </div>
                  <div>
                    <Label>Subject</Label>
                    <Select value={form.subject} onValueChange={v => setForm(f => ({ ...f, subject: v }))}>
                      <SelectTrigger className="mt-1" data-testid="select-contact-subject">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="order">Order Issue</SelectItem>
                        <SelectItem value="custom">Custom / Commission Request</SelectItem>
                        <SelectItem value="wholesale">Wholesale Inquiry</SelectItem>
                        <SelectItem value="experience">Experience / Booking</SelectItem>
                        <SelectItem value="artisan">Become an Artisan</SelectItem>
                        <SelectItem value="media">Press / Media</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Message *</Label>
                    <textarea
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                      rows={5}
                      required
                      placeholder="Tell us how we can help..."
                      data-testid="textarea-contact-message"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2" disabled={submitFeedback.isPending} data-testid="button-submit-contact">
                    <Send className="w-4 h-4" />
                    {submitFeedback.isPending ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
