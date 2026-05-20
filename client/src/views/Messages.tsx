import { useState, useEffect, useRef } from "react";
import { getDMs, saveDM, type DM } from "@/data/store";
import { Send } from "lucide-react";
import { useToast } from "@/components/Toast";

const CURRENT_USER = "You";

interface StaffMember {
  name: string;
  role: "Sales" | "Tech" | "Manager";
  initials: string;
  color: string;
}

const staff: StaffMember[] = [
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

export default function Messages() {
  const [selected, setSelected] = useState<string>(staff[0].name);
  const [dms, setDms] = useState<DM[]>(getDMs());
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Get thread between current user and selected staff
  function getThread(person: string) {
    return dms
      .filter(
        (m) =>
          (m.fromUser === CURRENT_USER && m.toUser === person) ||
          (m.fromUser === person && m.toUser === CURRENT_USER)
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  // Unread count for a person (messages FROM them that are unread)
  function unreadCount(person: string) {
    return dms.filter(
      (m) => m.fromUser === person && m.toUser === CURRENT_USER && !m.read
    ).length;
  }

  // Mark messages as read when selecting a thread
  useEffect(() => {
    const updated = dms.map((m) =>
      m.fromUser === selected && m.toUser === CURRENT_USER && !m.read
        ? { ...m, read: true }
        : m
    );
    const changed = updated.some((m, i) => m.read !== dms[i].read);
    if (changed) {
      setDms(updated);
      // Persist each updated message
      updated.forEach((m) => {
        if (m.fromUser === selected && m.toUser === CURRENT_USER) {
          saveDM(m);
        }
      });
    }
  }, [selected]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dms, selected]);

  const { showToast } = useToast();

  function handleSend() {
    if (!input.trim()) return;
    const newMsg: DM = {
      id: uid(),
      fromUser: CURRENT_USER,
      toUser: selected,
      body: input.trim(),
      timestamp: new Date().toISOString(),
      read: true,
    };
    saveDM(newMsg);
    setDms([...dms, newMsg]);
    setInput("");
    showToast("Message sent");
  }

  const thread = getThread(selected);
  const selectedStaff = staff.find((s) => s.name === selected)!;

  return (
    <div style={{ display: "flex", height: "calc(100vh - 48px)", gap: 0 }}>
      {/* Left: Staff list */}
      <div
        style={{
          width: 280,
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "10px 0 0 10px",
          overflowY: "auto",
          flexShrink: 0,
        }}
      >
        <div style={{ padding: "16px 16px 8px", fontFamily: "var(--font-heading)", fontSize: 18, color: "var(--color-text)" }}>
          Messages
        </div>
        {staff.map((person) => {
          const active = selected === person.name;
          const unread = unreadCount(person.name);
          return (
            <div
              key={person.name}
              onClick={() => setSelected(person.name)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                cursor: "pointer",
                background: active ? "rgba(232,93,36,0.08)" : "transparent",
                borderLeft: active ? "3px solid var(--color-accent)" : "3px solid transparent",
                transition: "background 0.12s",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: person.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                {person.initials}
              </div>
              {/* Name + role */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, color: "var(--color-text)", fontWeight: 500 }}>{person.name}</div>
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 6px",
                    borderRadius: 10,
                    background: roleColors[person.role].bg,
                    color: roleColors[person.role].text,
                    fontWeight: 600,
                  }}
                >
                  {person.role}
                </span>
              </div>
              {/* Unread badge */}
              {unread > 0 && (
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "var(--color-accent)",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {unread}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Right: Chat thread */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "var(--color-bg)",
          border: "1px solid var(--color-border)",
          borderLeft: "none",
          borderRadius: "0 10px 10px 0",
        }}
      >
        {/* Chat header */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: selectedStaff.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {selectedStaff.initials}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text)" }}>{selectedStaff.name}</div>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{selectedStaff.role}</div>
          </div>
        </div>

        {/* Messages area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {thread.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: 13, marginTop: 40 }}>
              No messages yet. Start the conversation!
            </div>
          )}
          {thread.map((msg) => {
            const isMe = msg.fromUser === CURRENT_USER;
            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent: isMe ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "70%",
                    padding: "10px 14px",
                    borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                    background: isMe ? "var(--color-accent)" : "var(--color-surface)",
                    color: isMe ? "#fff" : "var(--color-text)",
                    fontSize: 14,
                    lineHeight: 1.4,
                  }}
                >
                  <div>{msg.body}</div>
                  <div
                    style={{
                      fontSize: 10,
                      marginTop: 4,
                      opacity: 0.6,
                      textAlign: isMe ? "right" : "left",
                    }}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Input bar */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            gap: 8,
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={`Message ${selectedStaff.name}...`}
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
          <button
            onClick={handleSend}
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
    </div>
  );
}
