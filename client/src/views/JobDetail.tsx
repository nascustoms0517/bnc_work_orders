import { useState } from "react";
import { getJobs, saveJob, type Job } from "@/data/store";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Printer, Pencil } from "lucide-react";
import JobDrawer from "@/components/JobDrawer";

const statusOptions: { value: Job["status"]; label: string }[] = [
  { value: "intake", label: "Intake" },
  { value: "in-progress", label: "In Progress" },
  { value: "ready", label: "Ready" },
  { value: "complete", label: "Complete" },
];

const statusColors: Record<Job["status"], string> = {
  intake: "#888",
  "in-progress": "#E85D24",
  ready: "#22C55E",
  complete: "#3B82F6",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--color-text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: 4,
};

const valueStyle: React.CSSProperties = {
  fontSize: 15,
  color: "var(--color-text)",
};

const sectionStyle: React.CSSProperties = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: 10,
  padding: 20,
  marginBottom: 16,
};

export default function JobDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [refreshKey, setRefreshKey] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [noteText, setNoteText] = useState("");

  const jobs = getJobs();
  const job = jobs.find((j) => j.id === params.id);

  if (!job) {
    return (
      <div style={{ color: "var(--color-text-muted)", padding: 40, textAlign: "center" }}>
        Job not found.{" "}
        <button onClick={() => navigate("/")} style={{ color: "var(--color-accent)", background: "none", border: "none", cursor: "pointer" }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  function changeStatus(newStatus: Job["status"]) {
    job!.status = newStatus;
    saveJob(job!);
    setRefreshKey((k) => k + 1);
  }

  function addNote() {
    if (!noteText.trim()) return;
    if (!job!.internalNotes) job!.internalNotes = [];
    job!.internalNotes = [{ text: noteText.trim(), timestamp: new Date().toISOString() }, ...job!.internalNotes];
    saveJob(job!);
    setNoteText("");
    setRefreshKey((k) => k + 1);
  }

  function handlePrint() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const html = `
      <html><head><title>Work Order #${job!.jobNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        .sub { color: #666; font-size: 13px; margin-bottom: 24px; }
        .section { margin-bottom: 20px; }
        .section h2 { font-size: 14px; text-transform: uppercase; color: #888; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 8px; }
        .row { display: flex; gap: 32px; margin-bottom: 6px; }
        .label { font-size: 12px; color: #888; }
        .val { font-size: 14px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; }
        th { background: #f5f5f5; }
      </style></head><body>
      <h1>Work Order #${job!.jobNumber}</h1>
      <div class="sub">Created: ${new Date(job!.createdAt).toLocaleDateString()} | Status: ${job!.status}</div>
      <div class="section"><h2>Customer</h2>
        <div class="row"><div><span class="label">Name</span><div class="val">${job!.customerName}</div></div>
        <div><span class="label">Phone</span><div class="val">${job!.phone}</div></div></div>
      </div>
      <div class="section"><h2>Vehicle</h2>
        <div class="val">${job!.vehicle.year} ${job!.vehicle.make} ${job!.vehicle.model}</div>
      </div>
      <div class="section"><h2>Services</h2>
        <div class="val">${job!.serviceTypes.join(", ") || "None"}</div>
      </div>
      <div class="section"><h2>Parts</h2>
        <table><thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>
        ${job!.partsLines.map((p) => `<tr><td>${p.description}</td><td>${p.qty}</td><td>$${p.unitPrice}</td><td>$${p.qty * p.unitPrice}</td></tr>`).join("")}
        </tbody></table>
      </div>
      <div class="section"><h2>Assignment</h2>
        <div class="row"><div><span class="label">Tech</span><div class="val">${job!.techAssigned || "—"}</div></div>
        <div><span class="label">Salesperson</span><div class="val">${job!.salesperson || "—"}</div></div></div>
      </div>
      <div class="section"><h2>Estimate</h2><div class="val" style="font-size:18px;font-weight:bold;">$${job!.totalEstimate.toLocaleString()}</div></div>
      ${job!.notes ? `<div class="section"><h2>Notes</h2><div class="val">${job!.notes}</div></div>` : ""}
      ${job!.damage ? `<div class="section"><h2>Damage</h2><div class="val">${job!.damage}</div></div>` : ""}
      <script>window.print();</script>
      </body></html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  }

  function handleDrawerClose() {
    setDrawerOpen(false);
    setRefreshKey((k) => k + 1);
  }

  return (
    <div key={refreshKey}>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button
          onClick={() => navigate("/")}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: 14, fontFamily: "var(--font-body)" }}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setDrawerOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, color: "var(--color-text)", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-body)" }}
          >
            <Pencil size={14} /> Edit
          </button>
          <button
            onClick={handlePrint}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, color: "var(--color-text)", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-body)" }}
          >
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 26, color: "var(--color-text)", margin: 0 }}>
            Job #{job.jobNumber}
          </h1>
          <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
            Created {new Date(job.createdAt).toLocaleDateString()}
          </span>
        </div>
        <select
          value={job.status}
          onChange={(e) => changeStatus(e.target.value as Job["status"])}
          style={{
            padding: "8px 14px",
            background: "var(--color-bg)",
            border: `2px solid ${statusColors[job.status]}`,
            borderRadius: 8,
            color: statusColors[job.status],
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "var(--font-body)",
            cursor: "pointer",
            outline: "none",
          }}
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Content grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Customer */}
        <div style={sectionStyle}>
          <div style={labelStyle}>Customer</div>
          <div style={valueStyle}>{job.customerName}</div>
          <div style={{ ...valueStyle, color: "var(--color-text-muted)", fontSize: 13 }}>{job.phone}</div>
        </div>

        {/* Vehicle */}
        <div style={sectionStyle}>
          <div style={labelStyle}>Vehicle</div>
          <div style={valueStyle}>{job.vehicle.year} {job.vehicle.make} {job.vehicle.model}</div>
        </div>

        {/* Services */}
        <div style={sectionStyle}>
          <div style={labelStyle}>Services</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {job.serviceTypes.length > 0 ? job.serviceTypes.map((s) => (
              <span key={s} style={{ padding: "3px 10px", background: "rgba(232,93,36,0.1)", color: "var(--color-accent)", borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                {s}
              </span>
            )) : <span style={{ color: "var(--color-text-muted)", fontSize: 13 }}>None</span>}
          </div>
        </div>

        {/* Assignment */}
        <div style={sectionStyle}>
          <div style={labelStyle}>Assignment</div>
          <div style={{ display: "flex", gap: 24 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Tech</div>
              <div style={valueStyle}>{job.techAssigned || "—"}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Salesperson</div>
              <div style={valueStyle}>{job.salesperson || "—"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Parts */}
      {job.partsLines.length > 0 && (
        <div style={{ ...sectionStyle, marginTop: 0 }}>
          <div style={labelStyle}>Parts & Labor</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 8 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ textAlign: "left", padding: "8px 0", color: "var(--color-text-muted)", fontWeight: 500 }}>Description</th>
                <th style={{ textAlign: "center", padding: "8px 0", color: "var(--color-text-muted)", fontWeight: 500 }}>Qty</th>
                <th style={{ textAlign: "right", padding: "8px 0", color: "var(--color-text-muted)", fontWeight: 500 }}>Unit Price</th>
                <th style={{ textAlign: "right", padding: "8px 0", color: "var(--color-text-muted)", fontWeight: 500 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {job.partsLines.map((p, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "8px 0", color: "var(--color-text)" }}>{p.description}</td>
                  <td style={{ padding: "8px 0", color: "var(--color-text)", textAlign: "center" }}>{p.qty}</td>
                  <td style={{ padding: "8px 0", color: "var(--color-text)", textAlign: "right" }}>${p.unitPrice}</td>
                  <td style={{ padding: "8px 0", color: "var(--color-text)", textAlign: "right" }}>${p.qty * p.unitPrice}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ textAlign: "right", marginTop: 12, fontSize: 16, fontWeight: 700, color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
            Estimate: ${job.totalEstimate.toLocaleString()}
          </div>
        </div>
      )}

      {/* Notes & Damage */}
      {(job.notes || job.damage) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {job.notes && (
            <div style={sectionStyle}>
              <div style={labelStyle}>Notes</div>
              <div style={{ ...valueStyle, fontSize: 13, lineHeight: 1.5 }}>{job.notes}</div>
            </div>
          )}
          {job.damage && (
            <div style={sectionStyle}>
              <div style={labelStyle}>Damage</div>
              <div style={{ ...valueStyle, fontSize: 13, lineHeight: 1.5 }}>{job.damage}</div>
            </div>
          )}
        </div>
      )}

      {/* Internal Notes Timeline */}
      <div style={{ ...sectionStyle, marginTop: 16 }}>
        <div style={labelStyle}>Internal Notes</div>
        <div style={{ display: "flex", gap: 8, marginTop: 8, marginBottom: 16 }}>
          <input
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addNote()}
            placeholder="Add a note..."
            style={{
              flex: 1,
              padding: "10px 12px",
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              borderRadius: 6,
              color: "var(--color-text)",
              fontSize: 14,
              fontFamily: "var(--font-body)",
              outline: "none",
            }}
          />
          <button
            onClick={addNote}
            style={{
              padding: "10px 16px",
              background: "var(--color-accent)",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-body)",
            }}
          >
            Add
          </button>
        </div>
        {(job.internalNotes || []).length === 0 && (
          <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>No notes yet.</div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(job.internalNotes || []).map((note, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-accent)", marginTop: 6, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, color: "var(--color-text)" }}>{note.text}</div>
                <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>
                  {new Date(note.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Drawer */}
      <JobDrawer open={drawerOpen} onClose={handleDrawerClose} editJob={job} />
    </div>
  );
}
