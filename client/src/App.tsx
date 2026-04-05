import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import UrlNotifications from "./components/UrlNotifications";
import { ThemeProvider } from "./contexts/ThemeContext";
import { MediaProvider } from "./contexts/MediaContext";
import BackgroundVideo from "./components/BackgroundVideo";
import BackgroundMusic from "./components/BackgroundMusic";
import Home from "./pages/Home";
import Wizard from "./pages/Wizard";
import Catalog from "./pages/Catalog";
import MyBusinesses from "./pages/MyBusinesses";
import Monitoring from "./pages/Monitoring";
import TokenUsage from "./pages/TokenUsage";
import ApiConfig from "./pages/ApiConfig";
import Webhooks from "./pages/Webhooks";
import Blueprints from "./pages/Blueprints";
import Resources from "./pages/Resources";
import Settings from "./pages/Settings";
// Admin pages (hidden, accessed via /admin directly)
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPipeline from "./pages/admin/AdminPipeline";
import AdminPipelineDetail from "./pages/admin/AdminPipelineDetail";
import AdminManagement from "./pages/admin/AdminManagement";
import AdminAnalytics from "./pages/admin/AdminAnalytics";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/wizard" component={Wizard} />
      <Route path="/catalog" component={Catalog} />
      <Route path="/my-businesses" component={MyBusinesses} />
      <Route path="/monitoring" component={Monitoring} />
      <Route path="/token-usage" component={TokenUsage} />
      <Route path="/tokens" component={TokenUsage} />
      <Route path="/api-config" component={ApiConfig} />
      <Route path="/webhooks" component={Webhooks} />
      <Route path="/blueprints" component={Blueprints} />
      <Route path="/resources" component={Resources} />
      <Route path="/settings" component={Settings} />
      {/* Admin routes (no links from main UI) */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/pipeline" component={AdminPipeline} />
      <Route
        path="/admin/pipeline/:id"
        component={AdminPipelineDetail}
      />
      <Route path="/admin/admins" component={AdminManagement} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <MediaProvider>
          <TooltipProvider>
            {/* Global background media - renders behind everything */}
            <BackgroundVideo />
            <BackgroundMusic />

            {/* Handle URL-based notifications */}
            <UrlNotifications />

            <Toaster />
            <Router />
          </TooltipProvider>
        </MediaProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
