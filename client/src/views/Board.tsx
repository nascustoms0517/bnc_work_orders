import { useState } from "react";
import { getBoardMessages, saveBoardMessage, type BoardMessage } from "@/data/store";
import { Pin, Send } from "lucide-react";
import { useToast } from "@/components/Toast";

// Settings toggle — set to true to allow pin actions (manager mode)
const IS_MANAGER = true;

const PINNED_KEY = "bnc_board_pinned";

interface StaffInfo {
  name: string;
  role: "Sales" | "Tech" | "Manager";
  initials: string;
  color: string;
}

const allStaff: StaffInfo[] = [
  { name: "Mazin", role: "Sales", initials: "MZ", color: "#E85D24" },
  { name: "Frank", role: "Sales", initials: "FK", color: "#3B82F6" },
  { name: "Habibi", role: "Tech", initials: "HB", color: "#22C55E" },
  { name: "Maro", role: "Tech", initials: "MR", color: "#A855F7" },
  { name: "Ivan", role: "Tech", initials: "IV", color: "#EAB308" },
  { name: "Dale", role: "Manager", initials: "DL", color: "#EC4899" },
];

const roleColors: Record<string, { bg: string; text: string }> = {
  Sales: { bg: "rgba(59,130,246,0.15)", text: "#3B82F6" },
  Tech: { bg: "rgba(34,197,94,0.15)", text: "#22C55E" },
  Manager: { bg: "rgba(236,72,153,0.15)", text: "#EC4899" },
};

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function getStaffInfo(name: string): StaffInfo {
  return allStaff.find((s) => s.name === name) || { name, role: "Tech", initials: name.slice(0, 2).toUpperCase(), color: "#888" };
}

function getPinned(): string | null {
  return localStorage.getItem(PINNED_KEY);
}

function setPinned(id: string | null) {
  if (id) localStorage.setItem(PINNED_KEY, id);
  else localStorage.removeItem(PINNED_KEY);
}

export default function Board() {
  const [messages, setMessages] = useState<BoardMessage[]>(getBoardMessages());
  const [input, setInput] = useState("");
  const [poster, setPoster] = useState(allStaff[0].name);
  const [pinnedId, setPinnedId] = useState<string | null>(getPinned());

  const { showToast } = useToast();

  function handlePost() {
    if (!input.trim()) return;
    const msg: BoardMessage = {
      id: uid(),
      fromUser: poster,
      body: input.trim(),
      timestamp: new Date().toISOString(),
    };
    saveBoardMessage(msg);
    setMessages([msg, ...messages]);
    setInput("");
    showToast("Posted to board");
  }

  function handlePin(id: string) {
    const newId = pinnedId === id ? null : id;
    setPinned(newId);
    setPinnedId(newId);
  }

  // Sort reverse-chron
  const sorted = [...messages].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const pinnedMsg = pinnedId ? messages.find((m) => m.id === pinnedId) : null;

  function MessageCard({ msg, isPinned }: { msg: BoardMessage; isPinned?: boolean }) {
    const staff = getStaffInfo(msg.fromUser);
    const rc = roleColors[staff.role] || roleColors.Tech;
    return (
      <div
        style={{
          background: isPinned ? "rgba(232,93,36,0.05)" : "var(--color-surface)",
          border: `1px solid ${isPinned ? "var(--color-accent)" : "var(--color-border)"}`,
          borderRadius: 10,
          padding: 16,
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: staff.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {staff.initials}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>{staff.name}</span>
            <span
              style={{
                fontSize: 10,
                padding: "2px 6px",
                borderRadius: 10,
                background: rc.bg,
                color: rc.text,
                fontWeight: 600,
              }}
            >
              {staff.role}
            </span>
            <span style={{ fontSize: 11, color: "var(--color-text-muted)", marginLeft: "auto" }}>
              {new Date(msg.timestamp).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div style={{ fontSize: 14, color: "var(--color-text)", lineHeight: 1.5 }}>{msg.body}</div>
        </div>

        {/* Pin button (manager only) */}
        {IS_MANAGER && (
          <button
            onClick={() => handlePin(msg.id)}
            title={pinnedId === msg.id ? "Unpin" : "Pin this"}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: pinnedId === msg.id ? "var(--color-accent)" : "var(--color-text-muted)",
              opacity: pinnedId === msg.id ? 1 : 0.5,
              transition: "opacity 0.15s, color 0.15s",
              flexShrink: 0,
              marginTop: 2,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = pinnedId === msg.id ? "1" : "0.5")}
          >
            <Pin size={16} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 48px)" }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 28, color: "var(--color-text)", margin: 0 }}>
          Board
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "4px 0 0" }}>
          Team announcements and updates
        </p>
      </div>

      {/* Pinned message */}
      {pinnedMsg && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "var(--color-accent)", fontWeight: 600, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
            <Pin size={12} /> PINNED
          </div>
          <MessageCard msg={pinnedMsg} isPinned />
        </div>
      )}

      {/* Messages list */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingBottom: 16 }}>
        {sorted.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: 13, marginTop: 40 }}>
            No posts yet. Be the first to share something!
          </div>
        )}
        {sorted.map((msg) => (
          <MessageCard key={msg.id} msg={msg} />
        ))}
      </div>

      {/* Post bar */}
      <div
        style={{
          padding: "12px 0",
          borderTop: "1px solid var(--color-border)",
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        {/* Name selector */}
        <select
          value={poster}
          onChange={(e) => setPoster(e.target.value)}
          style={{
            padding: "10px 12px",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            color: "var(--color-text)",
            fontSize: 13,
            fontFamily: "var(--font-body)",
            outline: "none",
            width: 120,
          }}
        >
          {allStaff.map((s) => (
            <option key={s.name} value={s.name}>{s.name}</option>
          ))}
        </select>

        {/* Message input */}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handlePost()}
          placeholder="Post to the board..."
          style={{
            flex: 1,
            padding: "10px 14px",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            color: "var(--color-text)",
            fontSize: 14,
            fontFamily: "var(--font-body)",
            outline: "none",
          }}
        />

        {/* Send button */}
        <button
          onClick={handlePost}
          style={{
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--color-accent)",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <Send size={18} color="#fff" />
        </button>
      </div>
    </div>
  );
}
