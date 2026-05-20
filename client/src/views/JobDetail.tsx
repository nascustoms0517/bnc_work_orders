import { useState } from "react";
import { getJobs, saveJob, type Job } from "@/data/store";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Printer, Pencil } from "lucide-react";
import JobDrawer from "@/components/JobDrawer";
import { useToast } from "@/components/Toast";

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
  const { showToast } = useToast();

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
    showToast(`Status changed to ${newStatus}`);
  }

  function addNote() {
    if (!noteText.trim()) return;
    if (!job!.internalNotes) job!.internalNotes = [];
    job!.internalNotes = [{ text: noteText.trim(), timestamp: new Date().toISOString() }, ...job!.internalNotes];
    saveJob(job!);
    setNoteText("");
    setRefreshKey((k) => k + 1);
    showToast("Note added");
  }

  function handlePrint() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const html = `
      <html><head><title>Work Order #${job!.jobNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; padding: 32px 40px; color: #111; font-size: 13px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #E85D24; padding-bottom: 16px; margin-bottom: 24px; }
        .logo { font-size: 28px; font-weight: 900; letter-spacing: -1px; color: #E85D24; }
        .logo-sub { font-size: 11px; color: #666; margin-top: 2px; }
        .wo-num { font-size: 20px; font-weight: 700; text-align: right; }
        .wo-meta { font-size: 11px; color: #666; text-align: right; margin-top: 4px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 32px; margin-bottom: 20px; }
        .field { margin-bottom: 8px; }
        .field-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #888; margin-bottom: 2px; }
        .field-value { font-size: 14px; color: #111; }
        .section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #E85D24; font-weight: 700; margin: 20px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #eee; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 6px; }
        th { background: #f8f8f8; padding: 6px 10px; text-align: left; font-weight: 600; border: 1px solid #ddd; }
        td { padding: 6px 10px; border: 1px solid #ddd; }
        .total-row { font-weight: 700; font-size: 16px; text-align: right; margin-top: 12px; }
        .signature { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; }
        .sig-line { border-top: 1px solid #333; padding-top: 6px; font-size: 11px; color: #666; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <div class="header">
        <div><div class="logo">BNC</div><div class="logo-sub">Work Order</div></div>
        <div><div class="wo-num">#${job!.jobNumber}</div><div class="wo-meta">Date: ${new Date(job!.createdAt).toLocaleDateString()}<br>Status: ${job!.status.toUpperCase()}</div></div>
      </div>
      <div class="grid">
        <div class="field"><div class="field-label">Customer Name</div><div class="field-value">${job!.customerName}</div></div>
        <div class="field"><div class="field-label">Phone</div><div class="field-value">${job!.phone || '—'}</div></div>
        <div class="field"><div class="field-label">Vehicle</div><div class="field-value">${job!.vehicle.year} ${job!.vehicle.make} ${job!.vehicle.model}</div></div>
        <div class="field"><div class="field-label">Services</div><div class="field-value">${job!.serviceTypes.join(", ") || "None"}</div></div>
        <div class="field"><div class="field-label">Technician</div><div class="field-value">${job!.techAssigned || '—'}</div></div>
        <div class="field"><div class="field-label">Salesperson</div><div class="field-value">${job!.salesperson || '—'}</div></div>
      </div>
      ${job!.partsLines.length > 0 ? `
      <div class="section-title">Parts & Labor</div>
      <table><thead><tr><th>Part #</th><th>Description</th><th>Qty</th></tr></thead><tbody>
      ${job!.partsLines.map((p: any) => `<tr><td>${p.partNumber || '\u2014'}</td><td>${p.description}</td><td>${p.qty}</td></tr>`).join("")}
      </tbody></table>` : ''}
      ${job!.notes ? `<div class="section-title">Notes</div><p style="font-size:13px;line-height:1.5;">${job!.notes}</p>` : ''}
      ${job!.damage ? `<div class="section-title">Damage</div><p style="font-size:13px;line-height:1.5;">${job!.damage}</p>` : ''}
      <div class="signature">
        <div><div class="sig-line">Customer Signature</div></div>
        <div><div class="sig-line">Date</div></div>
      </div>
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
                <th style={{ textAlign: "left", padding: "8px 0", color: "var(--color-text-muted)", fontWeight: 500 }}>Part #</th>
                <th style={{ textAlign: "left", padding: "8px 0", color: "var(--color-text-muted)", fontWeight: 500 }}>Description</th>
                <th style={{ textAlign: "center", padding: "8px 0", color: "var(--color-text-muted)", fontWeight: 500 }}>Qty</th>
              </tr>
            </thead>
            <tbody>
              {job.partsLines.map((p, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "8px 0", color: "var(--color-text-muted)" }}>{(p as any).partNumber || "—"}</td>
                  <td style={{ padding: "8px 0", color: "var(--color-text)" }}>{p.description}</td>
                  <td style={{ padding: "8px 0", color: "var(--color-text)", textAlign: "center" }}>{p.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
