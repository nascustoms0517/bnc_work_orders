import { useState, useEffect, useRef, useMemo } from "react";
import { getDMs, saveDM, type DM } from "@/data/store";
import { getUsers, type User } from "@/data/users";
import { useAuth } from "@/contexts/AuthContext";
import { Send } from "lucide-react";

const roleBadge: Record<string, { bg: string; text: string }> = {
  manager: { bg: "rgba(232,93,36,0.15)", text: "#E85D24" },
  salesperson: { bg: "rgba(59,130,246,0.15)", text: "#3B82F6" },
  tech: { bg: "rgba(34,197,94,0.15)", text: "#22C55E" },
  tinter: { bg: "rgba(168,85,247,0.15)", text: "#A855F7" },
};

// Extended DM with userId fields
interface ExtDM extends DM {
  fromUserId?: string;
  toUserId?: string;
}

export default function Messages() {
  const { currentUser } = useAuth();
  const myId = currentUser?.id || "";
  const [dms, setDms] = useState<ExtDM[]>(getDMs() as ExtDM[]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const threadEndRef = useRef<HTMLDivElement>(null);

  // All staff except me
  const staff = useMemo(() => getUsers().filter((u) => u.id !== myId), [myId]);

  // Get thread between me and a person
  function getThread(personId: string): ExtDM[] {
    return dms
      .filter(
        (m) =>
          (m.fromUserId === myId && m.toUserId === personId) ||
          (m.fromUserId === personId && m.toUserId === myId)
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  // Last message with a person
  function lastMessage(personId: string): ExtDM | undefined {
    const thread = getThread(personId);
    return thread.length > 0 ? thread[thread.length - 1] : undefined;
  }

  // Unread count from a person
  function unreadFrom(personId: string): number {
    return dms.filter(
      (m) => m.fromUserId === personId && m.toUserId === myId && !m.read
    ).length;
  }

  // Sort staff: most recent message first, then alphabetical for those with no messages
  const sortedStaff = useMemo(() => {
    return [...staff].sort((a, b) => {
      const lastA = lastMessage(a.id);
      const lastB = lastMessage(b.id);
      if (lastA && lastB) {
        return new Date(lastB.timestamp).getTime() - new Date(lastA.timestamp).getTime();
      }
      if (lastA && !lastB) return -1;
      if (!lastA && lastB) return 1;
      return a.name.localeCompare(b.name);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staff, dms]);

  // Mark messages as read when selecting a thread
  useEffect(() => {
    if (!selectedId) return;
    let changed = false;
    const updated = dms.map((m) => {
      if (m.fromUserId === selectedId && m.toUserId === myId && !m.read) {
        changed = true;
        return { ...m, read: true };
      }
      return m;
    });
    if (changed) {
      updated.forEach((m, i) => {
        if (m.read !== dms[i].read) {
          saveDM(m);
        }
      });
      setDms(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // Scroll to bottom of thread
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dms, selectedId]);

  function handleSend() {
    if (!input.trim() || !selectedId) return;
    const person = staff.find((s) => s.id === selectedId);
    const newMsg: ExtDM = {
      id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
      fromUser: currentUser?.name || "",
      toUser: person?.name || "",
      fromUserId: myId,
      toUserId: selectedId,
      body: input.trim(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    saveDM(newMsg);
    setDms([...dms, newMsg]);
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const selectedPerson = staff.find((s) => s.id === selectedId);
  const thread = selectedId ? getThread(selectedId) : [];

  return (
    <div style={{ display: "flex", height: "calc(100vh - 73px)", margin: "-24px", overflow: "hidden" }}>
      {/* Left Column — Staff List */}
      <div
        style={{
          width: 280,
          minWidth: 280,
          borderRight: "1px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          background: "var(--color-surface)",
          overflow: "auto",
        }}
      >
        <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--color-border)" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, color: "var(--color-text)", margin: 0 }}>
            Messages
          </h2>
        </div>
        {sortedStaff.map((person) => {
          const last = lastMessage(person.id);
          const unread = unreadFrom(person.id);
          const isActive = selectedId === person.id;
          return (
            <div
              key={person.id}
              onClick={() => setSelectedId(person.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                cursor: "pointer",
                background: isActive ? "rgba(232,93,36,0.08)" : "transparent",
                borderBottom: "1px solid var(--color-border)",
                transition: "background 0.12s",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: isActive ? "var(--color-accent)" : "#3A3A3A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                {person.initials}
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{person.name}</span>
                  <span
                    style={{
                      fontSize: 9,
                      padding: "1px 5px",
                      borderRadius: 8,
                      fontWeight: 600,
                      background: roleBadge[person.role]?.bg,
                      color: roleBadge[person.role]?.text,
                    }}
                  >
                    {person.role}
                  </span>
                </div>
                {last && (
                  <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {last.body.slice(0, 40)}{last.body.length > 40 ? "\u2026" : ""}
                  </div>
                )}
              </div>
              {/* Right side: timestamp + badge */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                {last && (
                  <span style={{ fontSize: 10, color: "var(--color-text-muted)" }}>
                    {new Date(last.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
                {unread > 0 && (
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "var(--color-accent)",
                      color: "#fff",
                      fontSize: 10,
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
            </div>
          );
        })}
      </div>

      {/* Right Column — Conversation Thread */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--color-bg)" }}>
        {!selectedPerson ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", fontSize: 14 }}>
            Select a conversation from the left
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 20px",
                borderBottom: "1px solid var(--color-border)",
                background: "var(--color-surface)",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "var(--color-accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {selectedPerson.initials}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>{selectedPerson.name}</div>
                <span
                  style={{
                    fontSize: 10,
                    padding: "1px 6px",
                    borderRadius: 8,
                    fontWeight: 600,
                    background: roleBadge[selectedPerson.role]?.bg,
                    color: roleBadge[selectedPerson.role]?.text,
                  }}
                >
                  {selectedPerson.role}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflow: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              {thread.length === 0 && (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", fontSize: 13 }}>
                  Start a conversation with {selectedPerson.name}
                </div>
              )}
              {thread.map((msg) => {
                const isMine = msg.fromUserId === myId;
                return (
                  <div key={msg.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start" }}>
                    <div>
                      <div
                        style={{
                          maxWidth: 340,
                          padding: "10px 14px",
                          borderRadius: 12,
                          fontSize: 13,
                          lineHeight: 1.5,
                          background: isMine ? "var(--color-accent)" : "var(--color-surface)",
                          color: isMine ? "#fff" : "var(--color-text)",
                          border: isMine ? "none" : "1px solid var(--color-border)",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {msg.body}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--color-text-muted)",
                          marginTop: 3,
                          textAlign: isMine ? "right" : "left",
                          paddingLeft: isMine ? 0 : 4,
                          paddingRight: isMine ? 4 : 0,
                        }}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={threadEndRef} />
            </div>

            {/* Input Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 10,
                padding: "12px 20px",
                borderTop: "1px solid var(--color-border)",
                background: "var(--color-surface)",
              }}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${selectedPerson.name}...`}
                rows={1}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  color: "var(--color-text)",
                  fontSize: 13,
                  fontFamily: "var(--font-body)",
                  resize: "none",
                  outline: "none",
                  maxHeight: 72,
                  lineHeight: 1.4,
                  overflow: "auto",
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  border: "none",
                  background: input.trim() ? "var(--color-accent)" : "var(--color-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: input.trim() ? "pointer" : "default",
                  transition: "background 0.12s",
                }}
              >
                <Send size={16} color="#fff" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
