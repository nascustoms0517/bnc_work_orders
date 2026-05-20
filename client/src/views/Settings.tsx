import { useState } from "react";
import { getUsers, saveUser, deleteUser, type User } from "@/data/users";
import { getJobs, getDMs, getBoardMessages } from "@/data/store";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Pencil, Trash2, X, Download } from "lucide-react";

function generateInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatFileTimestamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}

function readStoredJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Settings() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>(getUsers());
  const [editing, setEditing] = useState<User | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formInitials, setFormInitials] = useState("");
  const [formRole, setFormRole] = useState<User["role"]>("tech");
  const [formCanSell, setFormCanSell] = useState(false);
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");

  function refresh() {
    setUsers(getUsers());
  }

  function openAdd() {
    setEditing(null);
    setAdding(true);
    setFormName("");
    setFormInitials("");
    setFormRole("tech");
    setFormCanSell(false);
    setFormUsername("");
    setFormPassword("bnc123");
  }

  function openEdit(user: User) {
    setAdding(true);
    setEditing(user);
    setFormName(user.name);
    setFormInitials(user.initials);
    setFormRole(user.role);
    setFormCanSell(user.canSell);
    setFormUsername(user.username);
    setFormPassword(user.password);
  }

  function closeForm() {
    setAdding(false);
    setEditing(null);
  }

  function handleNameChange(val: string) {
    setFormName(val);
    if (!editing) {
      setFormInitials(generateInitials(val));
    }
  }

  function handleRoleChange(val: User["role"]) {
    setFormRole(val);
    if (val === "manager" || val === "salesperson") {
      setFormCanSell(true);
    } else {
      setFormCanSell(false);
    }
  }

  function handleSave() {
    const user: User = {
      id: editing ? editing.id : "u" + Date.now(),
      name: formName.trim() || "New User",
      initials: formInitials.trim().slice(0, 2).toUpperCase() || "??",
      role: formRole,
      canSell: formCanSell,
      username: formUsername.trim().toLowerCase() || formName.trim().toLowerCase().replace(/\s+/g, ""),
      password: formPassword || "bnc123",
    };
    saveUser(user);
    refresh();
    closeForm();
  }

  function handleDelete(user: User) {
    if (user.id === currentUser?.id) return;
    deleteUser(user.id);
    refresh();
    setConfirmDelete(null);
  }

  function handleEndOfDayExport() {
    if (currentUser?.role !== "manager") return;

    const exportedAt = new Date();
    const exportPayload = {
      exportType: "bnc_end_of_day_backup",
      version: 1,
      exportedAt: exportedAt.toISOString(),
      exportedBy: currentUser,
      storageKeys: {
        users: "bnc_users",
        jobs: "bnc_jobs",
        directMessages: "bnc_dms",
        boardMessages: "bnc_board",
        boardPinnedId: "bnc_board_pinned",
        currentUser: "bnc_current_user",
      },
      data: {
        users: getUsers(),
        jobs: getJobs(),
        directMessages: getDMs(),
        boardMessages: getBoardMessages(),
        boardPinnedId: localStorage.getItem("bnc_board_pinned"),
        currentUser: readStoredJson<User>("bnc_current_user"),
      },
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bnc-end-of-day-${formatFileTimestamp(exportedAt)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const roleBadge: Record<string, { bg: string; text: string }> = {
    manager: { bg: "rgba(232,93,36,0.15)", text: "#E85D24" },
    salesperson: { bg: "rgba(59,130,246,0.15)", text: "#3B82F6" },
    tech: { bg: "rgba(34,197,94,0.15)", text: "#22C55E" },
    tinter: { bg: "rgba(168,85,247,0.15)", text: "#A855F7" },
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 11px",
    background: "var(--color-bg)",
    border: "1px solid var(--color-border)",
    borderRadius: 6,
    color: "var(--color-text)",
    fontSize: 13,
    fontFamily: "var(--font-body)",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    color: "var(--color-text-muted)",
    marginBottom: 4,
    fontWeight: 500,
  };

  if (currentUser?.role !== "manager") {
    return (
      <div>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 28, color: "var(--color-text)", margin: 0 }}>
          Settings
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>Only managers can access settings.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 28, color: "var(--color-text)", margin: 0 }}>
          Settings
        </h1>
      </div>

      {/* End of Day Export */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 10, padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, color: "var(--color-text)", margin: "0 0 6px" }}>
              End of Day Backup
            </h2>
            <p style={{ color: "var(--color-text-muted)", fontSize: 13, margin: 0 }}>
              Download a local JSON file containing staff, jobs, direct messages, board posts, pinned board state, and the current login record.
            </p>
          </div>
          <button
            onClick={handleEndOfDayExport}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
              background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: 6,
              fontSize: 13, fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            <Download size={14} /> Save Local File
          </button>
        </div>
      </div>

      {/* Staff Management */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--color-border)" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, color: "var(--color-text)", margin: 0 }}>
            Staff Management
          </h2>
          <button
            onClick={openAdd}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
              background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: 6,
              fontSize: 13, fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer",
            }}
          >
            <Plus size={14} /> Add Staff
          </button>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-body)", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)", textAlign: "left" }}>
              <th style={{ padding: "10px 16px", color: "var(--color-text-muted)", fontWeight: 500, fontSize: 11, textTransform: "uppercase" }}>Name</th>
              <th style={{ padding: "10px 16px", color: "var(--color-text-muted)", fontWeight: 500, fontSize: 11, textTransform: "uppercase" }}>Initials</th>
              <th style={{ padding: "10px 16px", color: "var(--color-text-muted)", fontWeight: 500, fontSize: 11, textTransform: "uppercase" }}>Role</th>
              <th style={{ padding: "10px 16px", color: "var(--color-text-muted)", fontWeight: 500, fontSize: 11, textTransform: "uppercase" }}>Can Sell</th>
              <th style={{ padding: "10px 16px", color: "var(--color-text-muted)", fontWeight: 500, fontSize: 11, textTransform: "uppercase" }}>Username</th>
              <th style={{ padding: "10px 16px", color: "var(--color-text-muted)", fontWeight: 500, fontSize: 11, textTransform: "uppercase" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={{ padding: "10px 16px", color: "var(--color-text)" }}>{u.name}</td>
                <td style={{ padding: "10px 16px", color: "var(--color-text-muted)" }}>{u.initials}</td>
                <td style={{ padding: "10px 16px" }}>
                  <span style={{ padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: roleBadge[u.role]?.bg, color: roleBadge[u.role]?.text }}>
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: "10px 16px", color: u.canSell ? "#22C55E" : "var(--color-text-muted)" }}>{u.canSell ? "Yes" : "No"}</td>
                <td style={{ padding: "10px 16px", color: "var(--color-text-muted)" }}>{u.username}</td>
                <td style={{ padding: "10px 16px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => openEdit(u)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                      <Pencil size={14} color="var(--color-text-muted)" />
                    </button>
                    {u.id !== currentUser?.id && (
                      <button onClick={() => setConfirmDelete(u)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                        <Trash2 size={14} color="#ef4444" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 32, textAlign: "center", color: "var(--color-text-muted)" }}>No staff members yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Panel */}
      {adding && (
        <>
          <div onClick={closeForm} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100 }} />
          <div
            style={{
              position: "fixed", top: 0, right: 0, width: 400, height: "100vh",
              background: "var(--color-surface)", borderLeft: "1px solid var(--color-border)",
              zIndex: 101, display: "flex", flexDirection: "column", overflow: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--color-border)" }}>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 18, color: "var(--color-text)", margin: 0 }}>
                {editing ? "Edit Staff" : "Add Staff"}
              </h3>
              <button onClick={closeForm} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} color="var(--color-text-muted)" />
              </button>
            </div>

            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
              <div>
                <label style={labelStyle}>Name</label>
                <input style={inputStyle} value={formName} onChange={(e) => handleNameChange(e.target.value)} placeholder="Full name" />
              </div>
              <div>
                <label style={labelStyle}>Initials (max 2 chars)</label>
                <input style={inputStyle} value={formInitials} onChange={(e) => setFormInitials(e.target.value.slice(0, 2).toUpperCase())} maxLength={2} />
              </div>
              <div>
                <label style={labelStyle}>Role</label>
                <select style={inputStyle} value={formRole} onChange={(e) => handleRoleChange(e.target.value as User["role"])}>
                  <option value="manager">Manager</option>
                  <option value="salesperson">Salesperson</option>
                  <option value="tech">Tech</option>
                  <option value="tinter">Tinter</option>
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Can Sell</label>
                <button
                  onClick={() => setFormCanSell(!formCanSell)}
                  style={{
                    width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
                    background: formCanSell ? "var(--color-accent)" : "var(--color-border)",
                    position: "relative", transition: "background 0.15s",
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%", background: "#fff",
                    position: "absolute", top: 3, left: formCanSell ? 21 : 3, transition: "left 0.15s",
                  }} />
                </button>
              </div>
              <div>
                <label style={labelStyle}>Username</label>
                <input style={inputStyle} value={formUsername} onChange={(e) => setFormUsername(e.target.value)} placeholder="login username" />
              </div>
              <div>
                <label style={labelStyle}>Password</label>
                <input style={inputStyle} value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="password" />
              </div>
            </div>

            <div style={{ padding: 20, borderTop: "1px solid var(--color-border)" }}>
              <button
                onClick={handleSave}
                style={{
                  width: "100%", padding: "12px 0", background: "var(--color-accent)", color: "#fff",
                  border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer",
                }}
              >
                {editing ? "Update Staff" : "Add Staff"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <>
          <div onClick={() => setConfirmDelete(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200 }} />
          <div
            style={{
              position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
              background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12,
              padding: 28, width: 340, zIndex: 201, textAlign: "center",
            }}
          >
            <p style={{ color: "var(--color-text)", fontSize: 15, margin: "0 0 20px" }}>
              Remove <strong>{confirmDelete.name}</strong> from the team?
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{ padding: "8px 20px", background: "var(--color-border)", color: "var(--color-text)", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                style={{ padding: "8px 20px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Remove
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
