import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import { usePermissions } from "@/_core/hooks/usePermissions";
import {
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Compass,
  Store,
  Activity,
  Settings,
  Coins,
  Webhook,
  Rocket,
  Zap
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { trpc } from "@/lib/trpc";
import MediaControls from "./MediaControls";
import LandingPage from "./LandingPage";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Compass, label: "Discovery Wizard", path: "/wizard" },
  { icon: Store, label: "Business Catalog", path: "/catalog" },
  { icon: Rocket, label: "My Businesses", path: "/my-businesses" },
  { icon: Activity, label: "Monitoring", path: "/monitoring" },
  { icon: Coins, label: "Token Usage", path: "/tokens" },
  { icon: Zap, label: "API Config", path: "/api-config" },
  { icon: Webhook, label: "Webhooks", path: "/webhooks" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  // Email verification gate: redirect unverified users
  if (user && (user as any).emailVerified === false) {
    const email = (user as any).email;
    if (email) {
      sessionStorage.setItem("verify_email", email);
    }
    window.location.href = "/verify-email";
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    // Check for auth errors in URL
    const urlParams = new URLSearchParams(window.location.search);
    const authError = urlParams.get("error");

    const getErrorMessage = (error: string | null) => {
      switch (error) {
        case "google_auth_denied":
          return "Google sign-in was cancelled. Please try again.";
        case "google_auth_invalid":
          return "Invalid authentication request. Please try again.";
        case "google_auth_state_invalid":
          return "Authentication session expired. Please try again.";
        case "google_auth_no_email":
          return "Could not retrieve email from Google. Please try again.";
        case "google_auth_failed":
          return "Google sign-in failed. Please try again.";
        default:
          return null;
      }
    };

    const errorMessage = getErrorMessage(authError);

    // Show the full landing page for unauthenticated users
    return <LandingPage errorMessage={errorMessage} />;
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { canAccessRoute } = usePermissions();
  const visibleMenuItems = menuItems.filter((item) =>
    canAccessRoute(item.path)
  );
  const activeMenuItem = visibleMenuItems.find(
    (item) => item.path === location
  );
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0 bg-slate-900"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center border-b border-slate-800">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-slate-400" />
              </button>
              {!isCollapsed ? (
                <>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <img src="/logo-64x64.png" alt="GO-GETTER OS" className="h-7 w-7 rounded-lg shrink-0" />
                    <span className="font-bold tracking-tight truncate text-white">
                      GO-GETTER
                    </span>
                  </div>
                  <MediaControls compact showVolumeSlider />
                </>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 bg-slate-900">
            <SidebarMenu className="px-2 py-2">
              {visibleMenuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-10 transition-all font-normal ${
                        isActive 
                          ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" 
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-emerald-400" : ""}`}
                      />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 bg-slate-900 border-t border-slate-800">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-slate-800 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                  <Avatar className="h-9 w-9 border border-slate-700 shrink-0">
                    {(user as any)?.pictureUrl && (
                      <AvatarImage src={(user as any).pictureUrl} alt={user?.name || "User"} />
                    )}
                    <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none text-white">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-emerald-500/30 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="bg-slate-950/80">
        {isMobile && (
          <div className="flex border-b border-slate-800 h-14 items-center justify-between bg-slate-900/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-slate-800 text-white" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-white">
                    {activeMenuItem?.label ?? "Menu"}
                  </span>
                </div>
              </div>
            </div>
            <MediaControls compact showVolumeSlider />
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
