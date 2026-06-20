import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import TourAssistant from "@/components/TourAssistant";
import { AuthProvider, useAuth, type UserRole } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { NotificationsProvider } from "@/lib/useNotifications";

// Public pages
import HomePage from "@/pages/home";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import ProductsPage from "@/pages/products";
import ProductDetailPage from "@/pages/product-detail";
import ArtisansPage from "@/pages/artisans";
import ArtisanDetailPage from "@/pages/artisan-detail";
import ExperiencesPage from "@/pages/experiences";
import ExperienceDetailPage from "@/pages/experience-detail";
import PackagesPage from "@/pages/packages";
import PackageDetailPage from "@/pages/package-detail";
import CartPage from "@/pages/cart";
import CheckoutPage from "@/pages/checkout";
import ImpactPage from "@/pages/impact";
import StoriesPage from "@/pages/stories";
import StoryDetailPage from "@/pages/story-detail";
import EventsPage from "@/pages/events";
import EventDetailPage from "@/pages/event-detail";
import AboutPage from "@/pages/about";
import FaqPage from "@/pages/faq";
import ContactPage from "@/pages/contact";
import NotFound from "@/pages/not-found";
import AccessDeniedPage from "@/pages/access-denied";
import NotificationsPage from "@/pages/notifications";
import TrackPage from "@/pages/track";
import PaymentSuccessPage from "@/pages/payment-success";
import PaymentFailedPage from "@/pages/payment-failed";
import BookingSuccessPage from "@/pages/booking-success";
import BookingDetailPage from "@/pages/booking-detail";
import BookingTicketPage from "@/pages/booking-ticket";
import BookingVerifyPage from "@/pages/booking-verify";

// Delivery / order detail pages
import CustomerOrderDetail from "@/pages/customer/order-detail";
import AdminDelivery from "@/pages/admin/delivery";

// Admin pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminProducts from "@/pages/admin/products";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminArtisans from "@/pages/admin/artisans";
import AdminExperiences from "@/pages/admin/experiences";
import AdminPackages from "@/pages/admin/packages";
import AdminOrders from "@/pages/admin/orders";
import AdminUsers from "@/pages/admin/users";
import AdminReviews from "@/pages/admin/reviews";
import AdminStories from "@/pages/admin/stories";
import AdminEvents from "@/pages/admin/events";
import AdminProductForm from "@/pages/admin/product-form";
import AdminNotifications from "@/pages/admin/notifications";
import AdminFeedback from "@/pages/admin/feedback";
import AdminSettings from "@/pages/admin/settings";
import AdminBookings from "@/pages/admin/bookings";
import AdminHomepage from "@/pages/admin/homepage";
import AdminEmailLogs from "@/pages/admin/email-logs";
import AdminGuides from "@/pages/admin/guides";

// Staff pages
import StaffDashboard from "@/pages/staff/dashboard";
import StaffOrders from "@/pages/staff/orders";
import StaffProducts from "@/pages/staff/products";
import StaffMessages from "@/pages/staff/messages";

// Artisan pages
import ArtisanDashboard from "@/pages/artisan/dashboard";
import ArtisanProducts from "@/pages/artisan/products";
import ArtisanProductsNew from "@/pages/artisan/products-new";
import ArtisanEarnings from "@/pages/artisan/earnings";
import ArtisanMessages from "@/pages/artisan/messages";

// Customer pages
import CustomerDashboard from "@/pages/customer/dashboard";
import CustomerOrders from "@/pages/customer/orders";
import CustomerBookings from "@/pages/customer/bookings";
import CustomerWishlist from "@/pages/customer/wishlist";
import CustomerMessages from "@/pages/customer/messages";
import CustomerNotifications from "@/pages/customer/notifications";
import CustomerFeedback from "@/pages/customer/feedback";

// Shared pages
import ProfilePage from "@/pages/shared/profile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
});

function ProtectedRoute({
  component: Component,
  roles,
}: {
  component: React.ComponentType;
  roles?: UserRole[];
}) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (roles && user && !roles.includes(user.role)) return <AccessDeniedPage />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/products" component={ProductsPage} />
      <Route path="/products/:id" component={ProductDetailPage} />
      <Route path="/artisans" component={ArtisansPage} />
      <Route path="/artisans/:id" component={ArtisanDetailPage} />
      <Route path="/experiences" component={ExperiencesPage} />
      <Route path="/experiences/:id" component={ExperienceDetailPage} />
      <Route path="/packages" component={PackagesPage} />
      <Route path="/packages/:id" component={PackageDetailPage} />
      <Route path="/stories" component={StoriesPage} />
      <Route path="/stories/:id" component={StoryDetailPage} />
      <Route path="/events" component={EventsPage} />
      <Route path="/events/:id" component={EventDetailPage} />
      <Route path="/impact" component={ImpactPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/faq" component={FaqPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/cart" component={CartPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/access-denied" component={AccessDeniedPage} />
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/track" component={TrackPage} />
      <Route path="/track/:trackingNumber" component={TrackPage} />
      <Route path="/payment-success" component={PaymentSuccessPage} />
      <Route path="/payment-failed" component={PaymentFailedPage} />
      <Route path="/booking-success" component={BookingSuccessPage} />
      <Route path="/booking-verify" component={BookingVerifyPage} />
      <Route path="/booking-ticket/:id" component={BookingTicketPage} />
      <Route path="/bookings/:id" component={BookingDetailPage} />

      {/* Shared profile — any authenticated role */}
      <Route path="/profile">
        {() => <ProtectedRoute component={ProfilePage} />}
      </Route>

      {/* Customer */}
      <Route path="/customer/dashboard">
        {() => <ProtectedRoute component={CustomerDashboard} roles={["customer"]} />}
      </Route>
      <Route path="/customer/orders/:id">
        {() => <ProtectedRoute component={CustomerOrderDetail} roles={["customer"]} />}
      </Route>
      <Route path="/customer/orders">
        {() => <ProtectedRoute component={CustomerOrders} roles={["customer"]} />}
      </Route>
      <Route path="/customer/bookings">
        {() => <ProtectedRoute component={CustomerBookings} roles={["customer"]} />}
      </Route>
      <Route path="/customer/wishlist">
        {() => <ProtectedRoute component={CustomerWishlist} roles={["customer"]} />}
      </Route>
      <Route path="/customer/messages">
        {() => <ProtectedRoute component={CustomerMessages} roles={["customer"]} />}
      </Route>
      <Route path="/customer/notifications">
        {() => <ProtectedRoute component={CustomerNotifications} roles={["customer"]} />}
      </Route>
      <Route path="/customer/feedback">
        {() => <ProtectedRoute component={CustomerFeedback} roles={["customer"]} />}
      </Route>

      {/* Artisan — /new must come before /:id */}
      <Route path="/artisan/products/new">
        {() => <ProtectedRoute component={ArtisanProductsNew} roles={["artisan"]} />}
      </Route>
      <Route path="/artisan/dashboard">
        {() => <ProtectedRoute component={ArtisanDashboard} roles={["artisan"]} />}
      </Route>
      <Route path="/artisan/products">
        {() => <ProtectedRoute component={ArtisanProducts} roles={["artisan"]} />}
      </Route>
      <Route path="/artisan/earnings">
        {() => <ProtectedRoute component={ArtisanEarnings} roles={["artisan"]} />}
      </Route>
      <Route path="/artisan/messages">
        {() => <ProtectedRoute component={ArtisanMessages} roles={["artisan"]} />}
      </Route>

      {/* Staff */}
      <Route path="/staff/dashboard">
        {() => <ProtectedRoute component={StaffDashboard} roles={["staff", "admin", "super_admin"]} />}
      </Route>
      <Route path="/staff/orders">
        {() => <ProtectedRoute component={StaffOrders} roles={["staff", "admin", "super_admin"]} />}
      </Route>
      <Route path="/staff/products">
        {() => <ProtectedRoute component={StaffProducts} roles={["staff", "admin", "super_admin"]} />}
      </Route>
      <Route path="/staff/messages">
        {() => <ProtectedRoute component={StaffMessages} roles={["staff", "admin", "super_admin"]} />}
      </Route>

      {/* Admin */}
      <Route path="/admin/dashboard">
        {() => <ProtectedRoute component={AdminDashboard} roles={["admin", "super_admin"]} />}
      </Route>
      <Route path="/admin/analytics">
        {() => <ProtectedRoute component={AdminAnalytics} roles={["admin", "super_admin"]} />}
      </Route>
      <Route path="/admin/products/new">
        {() => <ProtectedRoute component={() => <AdminProductForm />} roles={["admin", "super_admin"]} />}
      </Route>
      <Route path="/admin/products/:id/edit">
        {(params) => <ProtectedRoute component={() => <AdminProductForm productId={Number(params!.id)} />} roles={["admin", "super_admin"]} />}
      </Route>
      <Route path="/admin/products">
        {() => <ProtectedRoute component={AdminProducts} roles={["admin", "super_admin", "staff"]} />}
      </Route>
      <Route path="/admin/artisans">
        {() => <ProtectedRoute component={AdminArtisans} roles={["admin", "super_admin"]} />}
      </Route>
      <Route path="/admin/experiences">
        {() => <ProtectedRoute component={AdminExperiences} roles={["admin", "super_admin"]} />}
      </Route>
      <Route path="/admin/packages">
        {() => <ProtectedRoute component={AdminPackages} roles={["admin", "super_admin"]} />}
      </Route>
      <Route path="/admin/orders">
        {() => <ProtectedRoute component={AdminOrders} roles={["admin", "super_admin", "staff"]} />}
      </Route>
      <Route path="/admin/users">
        {() => <ProtectedRoute component={AdminUsers} roles={["admin", "super_admin"]} />}
      </Route>
      <Route path="/admin/reviews">
        {() => <ProtectedRoute component={AdminReviews} roles={["admin", "super_admin", "staff"]} />}
      </Route>
      <Route path="/admin/stories">
        {() => <ProtectedRoute component={AdminStories} roles={["admin", "super_admin"]} />}
      </Route>
      <Route path="/admin/events">
        {() => <ProtectedRoute component={AdminEvents} roles={["admin", "super_admin"]} />}
      </Route>
      <Route path="/admin/delivery">
        {() => <ProtectedRoute component={AdminDelivery} roles={["admin", "super_admin", "staff"]} />}
      </Route>
      <Route path="/admin/notifications">
        {() => <ProtectedRoute component={AdminNotifications} roles={["admin", "super_admin", "staff"]} />}
      </Route>
      <Route path="/admin/feedback">
        {() => <ProtectedRoute component={AdminFeedback} roles={["admin", "super_admin", "staff"]} />}
      </Route>
      <Route path="/admin/settings">
        {() => <ProtectedRoute component={AdminSettings} roles={["admin", "super_admin"]} />}
      </Route>
      <Route path="/admin/bookings">
        {() => <ProtectedRoute component={AdminBookings} roles={["admin", "super_admin", "staff"]} />}
      </Route>
      <Route path="/admin/guides">
        {() => <ProtectedRoute component={AdminGuides} roles={["admin", "super_admin"]} />}
      </Route>
      <Route path="/admin/homepage">
        {() => <ProtectedRoute component={AdminHomepage} roles={["admin", "super_admin"]} />}
      </Route>
      <Route path="/admin/email-logs">
        {() => <ProtectedRoute component={AdminEmailLogs} roles={["admin", "super_admin"]} />}
      </Route>

      {/* Catch-all */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <NotificationsProvider>
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
              <Toaster />
              <TourAssistant />
            </TooltipProvider>
          </NotificationsProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
