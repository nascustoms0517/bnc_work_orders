import "./styles/globals.css";
import { useState, useRef, useEffect, createContext, useContext } from "react";
import { Route, Switch, useLocation, Link } from "wouter";
import { LayoutDashboard, ClipboardList, MessageSquare, Columns3, Search, Bell, LogOut, Settings as SettingsIcon } from "lucide-react";
import { getDMs, getBoardMessages, getJobs } from "@/data/api";
import { ToastProvider } from "@/components/Toast";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Dashboard from "@/views/Dashboard";
import JobDetail from "@/views/JobDetail";
import Messages from "@/views/Messages";
import Board from "@/views/Board";
import Login from "@/views/Login";
import Settings from "@/views/Settings";

// Search context so Dashboard can read the global search query
export const SearchContext = createContext<{ query: string }>({ query: "" });
export function useSearch() { return useContext(SearchContext); }

function WorkOrders() {
  return <div />;
}

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/work-orders", icon: ClipboardList, label: "Work Orders" },
  { path: "/messages", icon: MessageSquare, label: "Messages" },
  { path: "/board", icon: Columns3, label: "Board" },
];

function Sidebar() {
  const [location] = useLocation();
  const { currentUser, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser) return;
    getDMs(currentUser.id).then((dms: any[]) => {
      const count = dms.filter((m) => {
        const isToMe = m.toUserId === currentUser.id || m.toUser === currentUser.name;
        return isToMe && !m.read;
      }).length;
      setUnreadCount(count);
    }).catch(() => {});
  }, [currentUser]);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 60,
        height: "100vh",
        background: "var(--color-surface)",
        borderRight: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 24,
        gap: 8,
        zIndex: 50,
      }}
    >
      {navItems.map((item) => {
        const active = location === item.path;
        const Icon = item.icon;
        const showBadge = item.path === "/messages" && unreadCount > 0;
        return (
          <Link key={item.path} href={item.path}>
            <div
              style={{
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                background: active ? "rgba(232,93,36,0.12)" : "transparent",
                cursor: "pointer",
                transition: "background 0.15s",
                position: "relative",
              }}
              title={item.label}
            >
              <Icon
                size={22}
                color={active ? "var(--color-accent)" : "var(--color-text-muted)"}
                strokeWidth={active ? 2.2 : 1.8}
              />
              {showBadge && (
                <div
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "var(--color-accent)",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </div>
              )}
            </div>
          </Link>
        );
      })}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Settings gear — managers only */}
      {currentUser && currentUser.role === "manager" && (
        <Link href="/settings">
          <div
            style={{
              width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 8, background: location === "/settings" ? "rgba(232,93,36,0.12)" : "transparent",
              cursor: "pointer", marginBottom: 4,
            }}
            title="Settings"
          >
            <SettingsIcon size={20} color={location === "/settings" ? "var(--color-accent)" : "var(--color-text-muted)"} />
          </div>
        </Link>
      )}

      {/* User avatar + logout at bottom */}
      {currentUser && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, paddingBottom: 16 }}>
          <div
            title={currentUser.name}
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "var(--color-accent)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "var(--font-body)",
            }}
          >
            {currentUser.initials}
          </div>
          <button
            onClick={logout}
            title="Logout"
            style={{
              width: 34,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
              borderRadius: 8,
            }}
          >
            <LogOut size={16} color="var(--color-text-muted)" />
          </button>
        </div>
      )}
    </nav>
  );
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<{ id: string; text: string; time: string }[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([getJobs(), getBoardMessages()]).then(([jobs, boardMsgs]) => {
      const items: { id: string; text: string; time: string }[] = [];
      (jobs as any[]).slice(0, 5).forEach((j) => {
        items.push({ id: "job-" + j.id, text: `Job #${j.jobNumber} — ${j.customerName} → ${j.status}`, time: j.createdAt });
      });
      (boardMsgs as any[])
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5)
        .forEach((m) => {
          items.push({ id: "board-" + m.id, text: `${m.fromUser} posted: "${m.body.slice(0, 40)}${m.body.length > 40 ? "…" : ""}"`, time: m.timestamp });
        });
      items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setNotifs(items.slice(0, 5));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 36,
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: open ? "rgba(232,93,36,0.12)" : "transparent",
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          cursor: "pointer",
          position: "relative",
        }}
      >
        <Bell size={18} color="var(--color-text-muted)" />
          {notifs.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--color-accent)",
            }}
          />
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: 44,
            right: 0,
            width: 320,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            zIndex: 200,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border)", fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>
            Notifications
          </div>
          {notifs.length === 0 && (
            <div style={{ padding: 20, textAlign: "center", color: "var(--color-text-muted)", fontSize: 13 }}>
              No recent activity.
            </div>
          )}
          {notifs.map((n) => (
            <div
              key={n.id}
              style={{
                padding: "10px 16px",
                borderBottom: "1px solid var(--color-border)",
                fontSize: 13,
                color: "var(--color-text)",
                lineHeight: 1.4,
              }}
            >
              <div>{n.text}</div>
              <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>
                {new Date(n.time).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AuthenticatedApp() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <SearchContext.Provider value={{ query: searchQuery }}>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <div style={{ marginLeft: 60, flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Top Header */}
          <header
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 24px",
              borderBottom: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              position: "sticky",
              top: 0,
              zIndex: 40,
            }}
          >
            {/* Search bar */}
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                padding: "8px 12px",
                maxWidth: 400,
              }}
            >
              <Search size={16} color="var(--color-text-muted)" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs by name, vehicle, job #, or tech..."
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--color-text)",
                  fontSize: 13,
                  fontFamily: "var(--font-body)",
                }}
              />
            </div>

            <div style={{ marginLeft: "auto" }}>
              <NotificationBell />
            </div>
          </header>

          {/* Main content */}
          <main style={{ flex: 1, padding: 24 }}>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/work-orders" component={WorkOrders} />
              <Route path="/work-orders/:id" component={JobDetail} />
              <Route path="/messages" component={Messages} />
              <Route path="/board" component={Board} />
              <Route path="/settings" component={Settings} />
            </Switch>
          </main>
        </div>
      </div>
    </SearchContext.Provider>
  );
}

function AppGate() {
  const { currentUser } = useAuth();
  if (!currentUser) return <Login />;
  return <AuthenticatedApp />;
}

function AppShell() {
  const { currentUser, loading } = useAuth();
  const [serverOk, setServerOk] = useState<boolean | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (serverOk === null) setServerOk(false);
    }, 5000);

    getUsers()
      .then(() => { setServerOk(true); clearTimeout(timeout); })
      .catch(() => { setServerOk(false); clearTimeout(timeout); });

    return () => clearTimeout(timeout);
  }, []);

  // Server unreachable
  if (serverOk === false) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", flexDirection: "column", gap: 16, textAlign: "center", padding: 24 }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <h1 style={{ color: "var(--color-text)", fontSize: 24, fontWeight: 600, margin: 0 }}>Cannot connect to server</h1>
        <p style={{ color: "var(--color-text-muted)", margin: 0, maxWidth: 400 }}>Make sure the BNC server is running at {(import.meta as any).env?.VITE_API_URL || 'http://localhost:8080'}</p>
      </div>
    );
  }

  // Connecting spinner
  if (serverOk === null || loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", flexDirection: "column", gap: 16, textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "2px solid var(--color-border)", borderTop: "2px solid var(--color-accent)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Connecting to BNC server...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Server reachable, show main app
  return <AppGate />;
}



function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
