import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function PasswordChangePage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      setSuccess("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Password change failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Change Password</h1>
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Current Password</label>
            <input
              style={styles.input}
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>New Password</label>
            <input
              style={styles.input}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Confirm New Password</label>
            <input
              style={styles.input}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Changing..." : "Change Password"}
          </button>
          <button
            style={styles.backButton}
            type="button"
            onClick={() => navigate("/sales")}
          >
            Back to Sales
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
    marginBottom: "24px",
    color: "#333",
    fontSize: "22px",
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
  backButton: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#6c757d",
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
  success: {
    color: "#27ae60",
    fontSize: "14px",
    marginBottom: "12px",
    textAlign: "center" as const,
  },
};
