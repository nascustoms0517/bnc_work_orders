import { getJobs, type Job } from "@/data/store";
import { useLocation } from "wouter";

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

export default function Dashboard() {
  const jobs = getJobs();
  const [, navigate] = useLocation();

  const totalJobs = jobs.length;
  const inProgress = jobs.filter((j) => j.status === "in-progress").length;
  const ready = jobs.filter((j) => j.status === "ready").length;

  const today = new Date().toDateString();
  const todayRevenue = jobs
    .filter((j) => new Date(j.createdAt).toDateString() === today)
    .reduce((sum, j) => sum + j.totalEstimate, 0);

  const stats = [
    { label: "Total Jobs", value: totalJobs },
    { label: "In Progress", value: inProgress },
    { label: "Ready for Pickup", value: ready },
    { label: "Today's Revenue", value: `$${todayRevenue.toLocaleString()}` },
  ];

  return (
    <div>
      <h1
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: 28,
          marginBottom: 24,
          color: "var(--color-text)",
        }}
      >
        Dashboard
      </h1>

      {/* Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 10,
              padding: "20px 16px",
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: "var(--color-text-muted)",
                marginBottom: 6,
                fontFamily: "var(--font-body)",
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                fontFamily: "var(--font-heading)",
                color: "var(--color-text)",
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Job List Table */}
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: "var(--font-body)",
            fontSize: 14,
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--color-border)",
                textAlign: "left",
              }}
            >
              {["Job #", "Customer", "Vehicle", "Service", "Status", "Tech", "Est."].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 14px",
                      color: "var(--color-text-muted)",
                      fontWeight: 500,
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr
                key={job.id}
                onClick={() => navigate(`/work-orders/${job.id}`)}
                style={{
                  borderBottom: "1px solid var(--color-border)",
                  cursor: "pointer",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.03)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <td style={{ padding: "12px 14px", color: "var(--color-text)" }}>
                  {job.jobNumber}
                </td>
                <td style={{ padding: "12px 14px", color: "var(--color-text)" }}>
                  {job.customerName}
                </td>
                <td style={{ padding: "12px 14px", color: "var(--color-text-muted)" }}>
                  {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
                </td>
                <td style={{ padding: "12px 14px", color: "var(--color-text-muted)" }}>
                  {job.serviceTypes.join(", ")}
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "3px 10px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                      background: statusColors[job.status].bg,
                      color: statusColors[job.status].text,
                    }}
                  >
                    {statusLabel[job.status]}
                  </span>
                </td>
                <td style={{ padding: "12px 14px", color: "var(--color-text-muted)" }}>
                  {job.techAssigned}
                </td>
                <td style={{ padding: "12px 14px", color: "var(--color-text)" }}>
                  ${job.totalEstimate.toLocaleString()}
                </td>
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: 32,
                    textAlign: "center",
                    color: "var(--color-text-muted)",
                  }}
                >
                  No jobs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
