import { Link, useLocation } from "wouter";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/cart";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";

export default function CartPage() {
  const { items, itemCount, subtotal, updateQty, removeFromCart, clearCart } = useCart();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleClear = () => {
    clearCart();
    toast({ title: "Cart cleared" });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <div className="w-24 h-24 rounded-full bg-muted mx-auto mb-6 flex items-center justify-center">
            <ShoppingBag className="w-12 h-12 text-muted-foreground" />
          </div>
          <h1 className="font-serif text-3xl font-bold mb-3">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">Every piece you add directly supports an artisan family in Rwanda.</p>
          <Link href="/products">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" data-testid="button-start-shopping">
              <ShoppingBag className="w-4 h-4 mr-2" /> Start Shopping
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-3xl font-bold">Your Cart ({itemCount} items)</h1>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleClear} data-testid="button-clear-cart">
            <Trash2 className="w-4 h-4 mr-1" /> Clear all
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const effectivePrice = item.discountPrice ?? item.price;
              const lineTotal = effectivePrice * item.quantity;
              return (
                <Card key={item.productId} className="border-border" data-testid={`card-cart-item-${item.productId}`}>
                  <CardContent className="p-4 flex gap-4">
                    <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full imigongo-pattern" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {item.artisanName && (
                        <div className="text-xs text-muted-foreground">{item.artisanName}</div>
                      )}
                      <h3 className="font-semibold text-sm leading-tight mb-1">{item.name}</h3>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-border rounded-lg">
                          <button
                            onClick={() => updateQty(item.productId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="px-2 py-1.5 hover:bg-muted disabled:opacity-40 transition-colors"
                            data-testid={`button-qty-minus-${item.productId}`}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-3 py-1.5 text-sm font-medium min-w-8 text-center" data-testid={`text-qty-${item.productId}`}>{item.quantity}</span>
                          <button
                            onClick={() => updateQty(item.productId, item.quantity + 1)}
                            className="px-2 py-1.5 hover:bg-muted transition-colors"
                            data-testid={`button-qty-plus-${item.productId}`}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          data-testid={`button-remove-${item.productId}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-primary" data-testid={`text-item-subtotal-${item.productId}`}>${lineTotal.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">${effectivePrice} each</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-24 border-border shadow-lg">
              <CardContent className="p-6">
                <h2 className="font-serif text-xl font-bold mb-4">Order Summary</h2>
                <div className="space-y-3 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
                    <span data-testid="text-subtotal">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-green-600">Calculated at checkout</span>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between font-bold text-lg mb-6">
                  <span>Total</span>
                  <span className="text-primary" data-testid="text-cart-total">${subtotal.toFixed(2)}</span>
                </div>
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                  onClick={() => setLocation("/checkout")}
                  data-testid="button-checkout"
                >
                  Checkout <ArrowRight className="w-4 h-4" />
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-3">
                  Secure checkout. Every purchase supports Rwandan artisans.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
