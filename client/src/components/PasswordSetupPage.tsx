import { useState, FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api";

export default function PasswordSetupPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const code = (location.state as any)?.code;

  // Redirect if no code in state
  if (!code) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/auth/setup-password", { code, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/sales");
    } catch (err: any) {
      setError(err.response?.data?.error || "Password setup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Set Your Password</h1>
        <p style={styles.subtitle}>
          This is your first login. Please set a password.
        </p>
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>New Password</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Confirm Password</label>
            <input
              style={styles.input}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
            />
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Setting up..." : "Set Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
  },
  card: {
    backgroundColor: "#fff",
    padding: "40px",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "400px",
  },
  title: {
    textAlign: "center" as const,
    marginBottom: "8px",
    color: "#333",
    fontSize: "22px",
  },
  subtitle: {
    textAlign: "center" as const,
    marginBottom: "24px",
    color: "#888",
    fontSize: "14px",
  },
  field: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    marginBottom: "6px",
    fontWeight: "bold",
    color: "#555",
    fontSize: "14px",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "14px",
    boxSizing: "border-box" as const,
  },
  button: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#4472C4",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "8px",
  },
  error: {
    color: "#e74c3c",
    fontSize: "14px",
    marginBottom: "12px",
    textAlign: "center" as const,
  },
};
