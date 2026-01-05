import { Home, MessageCircle, MapPin, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const MobileBottomNav = () => {
  const location = useLocation();

  const navItems = [
    { path: "/explore", icon: Home, label: "Feed" },
    { path: "/explore/messages", icon: MessageCircle, label: "Messages" },
    { path: "/plan-trip", icon: MapPin, label: "Planner" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  const isActive = (path: string) => {
    if (path === "/explore") {
      return location.pathname === "/explore" || location.pathname === "/explore/feed";
    }
    return location.pathname.startsWith(path);
  };

  // Calculate height with safe area
  const navHeight = "calc(4rem + env(safe-area-inset-bottom, 0px))";

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border"
      style={{ height: navHeight }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 min-w-[64px]",
                active
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "scale-110")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area spacer */}
      <div className="safe-area-inset-bottom" />
    </nav>
  );
};

export default MobileBottomNav;
