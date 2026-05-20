import { useState, useEffect } from "react";
import { saveJob, getJobs, type Job, type PartsLine } from "@/data/store";
import { ChevronDown, X, Plus, Trash2 } from "lucide-react";
import { getSellers, getTechs, getTinters } from "@/data/users";

const sellers = getSellers();
const techs = getTechs();
const tinters = getTinters();
const serviceOptions = ["Head Unit", "Speakers", "Amplifier", "Subwoofer", "Remote Start", "Window Tint", "Other"];

interface Props {
  open: boolean;
  onClose: () => void;
  editJob?: Job;
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: "1px solid var(--color-border)" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 0",
          background: "none",
          border: "none",
          color: "var(--color-text)",
          fontFamily: "var(--font-heading)",
          fontSize: 16,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {title}
        <ChevronDown
          size={18}
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            color: "var(--color-text-muted)",
          }}
        />
      </button>
      {open && <div style={{ paddingBottom: 16 }}>{children}</div>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "var(--color-bg)",
  border: "1px solid var(--color-border)",
  borderRadius: 6,
  color: "var(--color-text)",
  fontSize: 14,
  fontFamily: "var(--font-body)",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  color: "var(--color-text-muted)",
  marginBottom: 4,
  fontWeight: 500,
};

export default function JobDrawer({ open, onClose, editJob }: Props) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [factoryAmp, setFactoryAmp] = useState(false);

  const [services, setServices] = useState<string[]>([]);

  const [partsLines, setPartsLines] = useState<{ partNum: string; description: string; qty: number }[]>([]);

  const [tech, setTech] = useState("");
  const [tinter, setTinter] = useState("");
  const [salesperson, setSalesperson] = useState("");
  const [promiseDate, setPromiseDate] = useState("");

  const [notes, setNotes] = useState("");
  const [damage, setDamage] = useState("");

  // Pre-fill when editing
  useEffect(() => {
    if (editJob && open) {
      setCustomerName(editJob.customerName);
      setPhone(editJob.phone);
      setEmail("");
      setYear(editJob.vehicle.year);
      setMake(editJob.vehicle.make);
      setModel(editJob.vehicle.model);
      setColor("");
      setFactoryAmp(false);
      setServices([...editJob.serviceTypes]);
      setPartsLines(editJob.partsLines.map((p) => ({ partNum: (p as any).partNumber || "", description: p.description, qty: p.qty })));
      setTech(editJob.techAssigned);
      setTinter(editJob.tinterAssigned || "");
      setSalesperson(editJob.salesperson);
      setPromiseDate("");
      setNotes(editJob.notes);
      setDamage(editJob.damage);
    } else if (!editJob && open) {
      setCustomerName(""); setPhone(""); setEmail("");
      setYear(""); setMake(""); setModel(""); setColor(""); setFactoryAmp(false);
      setServices([]); setPartsLines([]);
      setTech(""); setTinter(""); setSalesperson(""); setPromiseDate("");
      setNotes(""); setDamage("");
    }
  }, [editJob, open]);

  function toggleService(s: string) {
    setServices((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  function addPartLine() {
    setPartsLines([...partsLines, { partNum: "", description: "", qty: 1 }]);
  }

  function updatePartLine(idx: number, field: string, value: string | number) {
    setPartsLines(partsLines.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
  }

  function removePartLine(idx: number) {
    setPartsLines(partsLines.filter((_, i) => i !== idx));
  }


  function handleSave() {
    if (editJob) {
      const updated: Job = {
        ...editJob,
        customerName: customerName || editJob.customerName,
        phone,
        vehicle: { year, make, model },
        serviceTypes: services,
        techAssigned: tech,
        tinterAssigned: tinter,
        salesperson,
        partsLines: partsLines.map((p) => ({ partNumber: p.partNum, description: p.description || p.partNum, qty: p.qty })),
        notes,
        damage,
      };
      saveJob(updated);
      onClose();
      return;
    }

    const jobs = getJobs();
    const maxNum = jobs.reduce((m, j) => Math.max(m, j.jobNumber), 1000);

    const newJob: Job = {
      id: uid(),
      jobNumber: maxNum + 1,
      status: "intake",
      customerName: customerName || "Walk-in",
      phone,
      vehicle: { year, make, model },
      serviceTypes: services,
      techAssigned: tech,
      tinterAssigned: tinter,
      salesperson,
      partsLines: partsLines.map((p) => ({ partNumber: p.partNum, description: p.description || p.partNum, qty: p.qty })),
      createdAt: new Date().toISOString(),
      notes,
      damage,
      internalNotes: [],
    };

    saveJob(newJob);
    onClose();

    // Reset form
    setCustomerName(""); setPhone(""); setEmail("");
    setYear(""); setMake(""); setModel(""); setColor(""); setFactoryAmp(false);
    setServices([]); setPartsLines([]);
    setTech(""); setTinter(""); setSalesperson(""); setPromiseDate("");
    setNotes(""); setDamage("");
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 90,
            transition: "opacity 0.2s",
          }}
        />
      )}

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: 520,
          maxWidth: "100vw",
          height: "100vh",
          background: "var(--color-surface)",
          borderLeft: "1px solid var(--color-border)",
          zIndex: 100,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s cubic-bezier(0.23,1,0.32,1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 24px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 22, color: "var(--color-text)", margin: 0 }}>
            {editJob ? `Edit Job #${editJob.jobNumber}` : "New Job"}
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px" }}>
          {/* 1. Customer Info */}
          <Accordion title="Customer Info" defaultOpen={true}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={labelStyle}>Name</label>
                <input style={inputStyle} value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 000-0000" />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
              </div>
            </div>
          </Accordion>

          {/* 2. Vehicle */}
          <Accordion title="Vehicle">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>Year</label>
                <input style={inputStyle} value={year} onChange={(e) => setYear(e.target.value)} placeholder="2024" />
              </div>
              <div>
                <label style={labelStyle}>Make</label>
                <input style={inputStyle} value={make} onChange={(e) => setMake(e.target.value)} placeholder="Toyota" />
              </div>
              <div>
                <label style={labelStyle}>Model</label>
                <input style={inputStyle} value={model} onChange={(e) => setModel(e.target.value)} placeholder="Camry" />
              </div>
              <div>
                <label style={labelStyle}>Color</label>
                <input style={inputStyle} value={color} onChange={(e) => setColor(e.target.value)} placeholder="Black" />
              </div>
            </div>
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={factoryAmp}
                onChange={(e) => setFactoryAmp(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "var(--color-accent)" }}
              />
              <span style={{ fontSize: 13, color: "var(--color-text)" }}>Factory Amplifier</span>
            </div>
          </Accordion>

          {/* 3. Services */}
          <Accordion title="Services">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {serviceOptions.map((s) => (
                <label key={s} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--color-text)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={services.includes(s)}
                    onChange={() => toggleService(s)}
                    style={{ width: 16, height: 16, accentColor: "var(--color-accent)" }}
                  />
                  {s}
                </label>
              ))}
            </div>
          </Accordion>

          {/* 4. Parts & Labor */}
          <Accordion title="Parts & Labor">
            {partsLines.map((line, idx) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "80px 1fr 50px 30px", gap: 6, marginBottom: 8, alignItems: "end" }}>
                <div>
                  <label style={labelStyle}>Part #</label>
                  <input style={inputStyle} value={line.partNum} onChange={(e) => updatePartLine(idx, "partNum", e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Description</label>
                  <input style={inputStyle} value={line.description} onChange={(e) => updatePartLine(idx, "description", e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Qty</label>
                  <input style={inputStyle} type="number" min={1} value={line.qty} onChange={(e) => updatePartLine(idx, "qty", Number(e.target.value))} />
                </div>
                <button
                  type="button"
                  onClick={() => removePartLine(idx)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", paddingBottom: 10 }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addPartLine}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "1px dashed var(--color-border)",
                borderRadius: 6,
                padding: "8px 12px",
                color: "var(--color-accent)",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "var(--font-body)",
              }}
            >
              <Plus size={14} /> Add Line Item
            </button>

          </Accordion>

          {/* 5. Assignment */}
          <Accordion title="Assignment">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={labelStyle}>Technician</label>
                <select style={inputStyle} value={tech} onChange={(e) => setTech(e.target.value)}>
                  <option value="">-- Select --</option>
                  {techs.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
              </div>
              {services.includes("Window Tint") && (
                <div>
                  <label style={labelStyle}>Tinter</label>
                  <select style={inputStyle} value={tinter} onChange={(e) => setTinter(e.target.value)}>
                    <option value="">-- Select --</option>
                    {tinters.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label style={labelStyle}>Salesperson</label>
                <select style={inputStyle} value={salesperson} onChange={(e) => setSalesperson(e.target.value)}>
                  <option value="">-- Select --</option>
                  {sellers.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Promise Date</label>
                <input style={inputStyle} type="date" value={promiseDate} onChange={(e) => setPromiseDate(e.target.value)} />
              </div>
            </div>
          </Accordion>

          {/* 6. Notes & Damage */}
          <Accordion title="Notes & Damage">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={labelStyle}>Notes</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions..."
                />
              </div>
              <div>
                <label style={labelStyle}>Damage</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
                  value={damage}
                  onChange={(e) => setDamage(e.target.value)}
                  placeholder="Pre-existing damage notes..."
                />
              </div>
            </div>
          </Accordion>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--color-border)" }}>
          <button
            onClick={handleSave}
            style={{
              width: "100%",
              padding: "12px",
              background: "var(--color-accent)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "var(--font-body)",
              cursor: "pointer",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Save Job
          </button>
        </div>
      </div>
    </>
  );
}
