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
import {
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Rocket,
  ShieldCheck,
  Mic,
  FileText,
  BarChart3,
  ArrowLeft,
  ShieldAlert,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "@/components/ui/button";

const adminMenuItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard Overview",
    path: "/admin",
  },
  {
    icon: Rocket,
    label: "Business Pipeline",
    path: "/admin/pipeline",
  },
  {
    icon: ShieldCheck,
    label: "User Administration",
    path: "/admin/admins",
  },
  {
    icon: Mic,
    label: "Voice Assistant",
    path: "/admin/voice",
    disabled: true,
  },
  {
    icon: FileText,
    label: "Content Tools",
    path: "/admin/content",
    disabled: true,
  },
  {
    icon: BarChart3,
    label: "Analytics",
    path: "/admin/analytics",
  },
];

const SIDEBAR_WIDTH_KEY = "admin-sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function AdminLayout({
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
    return <DashboardLayoutSkeleton />;
  }

  // Access control: admin only
  if (!user || (user as any).role !== "admin") {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-center space-y-4">
          <ShieldAlert className="h-16 w-16 text-red-400 mx-auto" />
          <h1 className="text-2xl font-bold text-white">
            Access Denied
          </h1>
          <p className="text-slate-400">
            You do not have admin privileges to access this area.
          </p>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <AdminLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </AdminLayoutContent>
    </SidebarProvider>
  );
}

function AdminLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = adminMenuItems.find(
    (item) => item.path === location
  );
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft =
        sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsResizing(false);

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
                className="h-8 w-8 flex items-center justify-center hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-slate-400" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <img src="/logo-64x64.png" alt="GO-GETTER OS" className="h-7 w-7 rounded-lg shrink-0" />
                  <span className="font-bold tracking-tight truncate text-white">
                    ADMIN
                  </span>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 bg-slate-900">
            <SidebarMenu className="px-2 py-2">
              {adminMenuItems.map((item) => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() =>
                        !item.disabled && setLocation(item.path)
                      }
                      tooltip={
                        item.disabled
                          ? `${item.label} (Coming Soon)`
                          : item.label
                      }
                      className={`h-10 transition-all font-normal ${
                        item.disabled
                          ? "text-slate-600 cursor-not-allowed"
                          : isActive
                            ? "bg-violet-500/10 text-violet-400 hover:bg-violet-500/20"
                            : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-violet-400" : ""}`}
                      />
                      <span>
                        {item.label}
                        {item.disabled && (
                          <span className="ml-1.5 text-[10px] text-slate-600">
                            Soon
                          </span>
                        )}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 bg-slate-900 border-t border-slate-800">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-slate-400 hover:text-white mb-2 group-data-[collapsible=icon]:justify-center"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-data-[collapsible=icon]:mr-0" />
              <span className="group-data-[collapsible=icon]:hidden">
                Customer View
              </span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-slate-800 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
                  <Avatar className="h-9 w-9 border border-slate-700 shrink-0">
                    {(user as any)?.pictureUrl && (
                      <AvatarImage
                        src={(user as any).pictureUrl}
                        alt={user?.name || "Admin"}
                      />
                    )}
                    <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-violet-500 to-purple-600 text-white">
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
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-violet-500/30 transition-colors ${isCollapsed ? "hidden" : ""}`}
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
              <span className="tracking-tight text-white">
                {activeMenuItem?.label ?? "Admin"}
              </span>
            </div>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
