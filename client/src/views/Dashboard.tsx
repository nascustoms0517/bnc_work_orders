import { useState, useMemo } from "react";
import { getJobs, type Job } from "@/data/store";
import { useLocation } from "wouter";
import JobDrawer from "@/components/JobDrawer";
import { useToast } from "@/components/Toast";
import { Plus, ArrowUp, ArrowDown } from "lucide-react";
import { useSearch } from "@/App";
import { useAuth } from "@/contexts/AuthContext";
import { getTechs } from "@/data/users";

const statusColors: Record<Job["status"], { bg: string; text: string }> = {
  intake: { bg: "#3A3A3A", text: "#AAAAAA" },
  "in-progress": { bg: "rgba(232,93,36,0.15)", text: "#E85D24" },
  ready: { bg: "rgba(34,197,94,0.15)", text: "#22C55E" },
  complete: { bg: "rgba(59,130,246,0.15)", text: "#3B82F6" },
};

const statusLabel: Record<Job["status"], string> = {
  intake: "Intake",
  "in-progress": "In Progress",
  ready: "Ready",
  complete: "Complete",
};

const techUsers = getTechs();
const techNames = techUsers.map((t) => t.name);

type SortKey = "jobNumber" | "customerName" | "vehicle" | "status" | "techAssigned";
type SortDir = "asc" | "desc";

export default function Dashboard() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const rawJobs = getJobs();
  const [, navigate] = useLocation();
  const { query } = useSearch();
  const { showToast } = useToast();
  const { currentUser } = useAuth();
  const role = currentUser?.role || "manager";
  const userName = currentUser?.name || "";

  // Role-based job filtering
  const allJobs = useMemo(() => {
    if (role === "tech") return rawJobs.filter((j) => j.techAssigned === userName);
    if (role === "tinter") return rawJobs.filter((j) => j.serviceTypes.includes("Window Tint"));
    if (role === "salesperson") {
      return [...rawJobs].sort((a, b) => {
        const aIsMine = a.salesperson === userName ? 0 : 1;
        const bIsMine = b.salesperson === userName ? 0 : 1;
        return aIsMine - bIsMine;
      });
    }
    return rawJobs; // manager sees all
  }, [rawJobs, role, userName]);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTech, setFilterTech] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>("jobNumber");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleDrawerClose() {
    setDrawerOpen(false);
    setRefreshKey((k) => k + 1);
    showToast("Job saved successfully");
  }

  // Filter by search query
  const searched = query.trim()
    ? allJobs.filter((j) => {
        const q = query.toLowerCase();
        return (
          j.customerName.toLowerCase().includes(q) ||
          j.jobNumber.toString().includes(q) ||
          `${j.vehicle.year} ${j.vehicle.make} ${j.vehicle.model}`.toLowerCase().includes(q) ||
          j.techAssigned.toLowerCase().includes(q)
        );
      })
    : allJobs;

  // Apply filters
  const filtered = useMemo(() => {
    return searched.filter((j) => {
      if (filterStatus !== "all" && j.status !== filterStatus) return false;
      if (filterTech !== "all" && j.techAssigned !== filterTech) return false;
      if (filterDateFrom && new Date(j.createdAt) < new Date(filterDateFrom)) return false;
      if (filterDateTo && new Date(j.createdAt) > new Date(filterDateTo + "T23:59:59")) return false;
      return true;
    });
  }, [searched, filterStatus, filterTech, filterDateFrom, filterDateTo]);

  // Apply sort
  const jobs = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";
      switch (sortKey) {
        case "jobNumber": aVal = a.jobNumber; bVal = b.jobNumber; break;
        case "customerName": aVal = a.customerName.toLowerCase(); bVal = b.customerName.toLowerCase(); break;
        case "vehicle": aVal = `${a.vehicle.make} ${a.vehicle.model}`.toLowerCase(); bVal = `${b.vehicle.make} ${b.vehicle.model}`.toLowerCase(); break;
        case "status": aVal = a.status; bVal = b.status; break;
        case "techAssigned": aVal = a.techAssigned.toLowerCase(); bVal = b.techAssigned.toLowerCase(); break;

      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filtered, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const today = new Date().toDateString();

  const stats = useMemo(() => {
    if (role === "tech") {
      return [
        { label: "My Jobs", value: allJobs.length },
        { label: "My In Progress", value: allJobs.filter((j) => j.status === "in-progress").length },
        { label: "My Completed Today", value: allJobs.filter((j) => j.status === "complete" && new Date(j.createdAt).toDateString() === today).length },
      ];
    }
    if (role === "tinter") {
      return [
        { label: "Tint Jobs", value: allJobs.length },
        { label: "Tint In Progress", value: allJobs.filter((j) => j.status === "in-progress").length },
        { label: "Tint Completed Today", value: allJobs.filter((j) => j.status === "complete" && new Date(j.createdAt).toDateString() === today).length },
      ];
    }
    // salesperson + manager
    return [
      { label: "Total Jobs", value: allJobs.length },
      { label: "In Progress", value: allJobs.filter((j) => j.status === "in-progress").length },
      { label: "Ready for Pickup", value: allJobs.filter((j) => j.status === "ready").length },
      { label: "Completed Today", value: allJobs.filter((j) => j.status === "complete" && new Date(j.createdAt).toDateString() === today).length },
    ];
  }, [allJobs, role, today]);

  const selectStyle: React.CSSProperties = {
    padding: "8px 10px",
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: 6,
    color: "var(--color-text)",
    fontSize: 12,
    fontFamily: "var(--font-body)",
    outline: "none",
  };

  const columns: { key: SortKey; label: string }[] = [
    { key: "jobNumber", label: "Job #" },
    { key: "customerName", label: "Customer" },
    { key: "vehicle", label: "Vehicle" },
    { key: "status", label: "Status" },
    { key: "techAssigned", label: "Tech" },

  ];

  return (
    <div key={refreshKey}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 28, color: "var(--color-text)", margin: 0 }}>
          Dashboard
        </h1>
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "10px 16px",
            background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: 8,
            fontSize: 14, fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer",
          }}
        >
          <Plus size={16} /> Add Job
        </button>
      </div>

      <JobDrawer open={drawerOpen} onClose={handleDrawerClose} />

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 10, padding: "20px 16px" }}>
            <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 6, fontFamily: "var(--font-body)" }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <select style={selectStyle} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="intake">Intake</option>
          <option value="in-progress">In Progress</option>
          <option value="ready">Ready</option>
          <option value="complete">Complete</option>
        </select>
        <select style={selectStyle} value={filterTech} onChange={(e) => setFilterTech(e.target.value)}>
          <option value="all">All Techs</option>
          {techNames.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input type="date" style={selectStyle} value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} title="From date" />
        <span style={{ color: "var(--color-text-muted)", fontSize: 12 }}>to</span>
        <input type="date" style={selectStyle} value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} title="To date" />
        {(filterStatus !== "all" || filterTech !== "all" || filterDateFrom || filterDateTo) && (
          <button
            onClick={() => { setFilterStatus("all"); setFilterTech("all"); setFilterDateFrom(""); setFilterDateTo(""); }}
            style={{ background: "none", border: "none", color: "var(--color-accent)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)" }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Job List Table */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-body)", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)", textAlign: "left" }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={{
                    padding: "12px 14px", color: "var(--color-text-muted)", fontWeight: 500,
                    fontSize: 12, textTransform: "uppercase", letterSpacing: "0.5px", cursor: "pointer", userSelect: "none",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {col.label}
                    {sortKey === col.key && (sortDir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                  </span>
                </th>
              ))}
              <th style={{ padding: "12px 14px", color: "var(--color-text-muted)", fontWeight: 500, fontSize: 12, textTransform: "uppercase" }}>Service</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr
                key={job.id}
                onClick={() => navigate(`/work-orders/${job.id}`)}
                style={{ borderBottom: "1px solid var(--color-border)", cursor: "pointer", transition: "background 0.12s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "12px 14px", color: "var(--color-text)" }}>{job.jobNumber}</td>
                <td style={{ padding: "12px 14px", color: "var(--color-text)" }}>{job.customerName}</td>
                <td style={{ padding: "12px 14px", color: "var(--color-text-muted)" }}>{job.vehicle.year} {job.vehicle.make} {job.vehicle.model}</td>
                <td style={{ padding: "12px 14px" }}>
                  <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: statusColors[job.status].bg, color: statusColors[job.status].text }}>
                    {statusLabel[job.status]}
                  </span>
                </td>
                <td style={{ padding: "12px 14px", color: "var(--color-text-muted)" }}>{job.techAssigned}</td>

                <td style={{ padding: "12px 14px", color: "var(--color-text-muted)" }}>{job.serviceTypes.join(", ")}</td>
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 32, textAlign: "center", color: "var(--color-text-muted)" }}>
                  No jobs match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
