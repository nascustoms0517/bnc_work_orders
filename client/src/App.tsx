import "./styles/globals.css";
import { Route, Switch, useLocation, Link } from "wouter";
import { LayoutDashboard, ClipboardList, MessageSquare, Columns3 } from "lucide-react";

function Dashboard() {
  return <div />;
}
function WorkOrders() {
  return <div />;
}
function Messages() {
  return <div />;
}
function Board() {
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
              }}
              title={item.label}
            >
              <Icon
                size={22}
                color={active ? "var(--color-accent)" : "var(--color-text-muted)"}
                strokeWidth={active ? 2.2 : 1.8}
              />
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

function App() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ marginLeft: 60, flex: 1, padding: 24 }}>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/work-orders" component={WorkOrders} />
          <Route path="/messages" component={Messages} />
          <Route path="/board" component={Board} />
        </Switch>
      </main>
    </div>
  );
}

export default App;
