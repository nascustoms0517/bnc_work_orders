import { useState } from "react";
import { authenticate } from "@/data/users";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const user = authenticate(username.trim().toLowerCase(), password);
    if (user) {
      login(user);
    } else {
      setError("Invalid username or password");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg)",
        fontFamily: "var(--font-body)",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 340,
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 12,
          padding: 36,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 42,
              fontWeight: 800,
              color: "var(--color-accent)",
              letterSpacing: -2,
            }}
          >
            BNC
          </div>
          <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 4 }}>
            Work Orders
          </div>
        </div>

        {/* Username */}
        <div>
          <label style={{ display: "block", fontSize: 12, color: "var(--color-text-muted)", marginBottom: 4 }}>
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            style={{
              width: "100%",
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
        </div>

        {/* Password */}
        <div>
          <label style={{ display: "block", fontSize: 12, color: "var(--color-text-muted)", marginBottom: 4 }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
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
        </div>

        {/* Error */}
        {error && (
          <div style={{ fontSize: 13, color: "#ef4444", textAlign: "center" }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px 0",
            background: "var(--color-accent)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
            fontFamily: "var(--font-body)",
            cursor: "pointer",
            marginTop: 4,
          }}
        >
          Log In
        </button>
      </form>
    </div>
  );
}
