import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

interface SalesRow {
  INVOICE_NO: string;
  CUSTOMERCODE: string;
  CUSTOMERNAME: string;
  GOODSCODE: string;
  GOODSNAME: string;
  SALES_QTY: number;
  SALES_AMOUNT: number;
}

export default function SalesSearchPage() {
  const [customerCode, setCustomerCode] = useState("");
  const [goodsCode, setGoodsCode] = useState("");
  const [results, setResults] = useState<SalesRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setSearched(true);

    try {
      const params: Record<string, string> = {};
      if (customerCode) params.customerCode = customerCode;
      if (goodsCode) params.goodsCode = goodsCode;

      const res = await api.get("/sales", { params });
      setResults(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);

    try {
      const params: Record<string, string> = {};
      if (customerCode) params.customerCode = customerCode;
      if (goodsCode) params.goodsCode = goodsCode;

      const res = await api.get("/sales/export", {
        params,
        responseType: "blob",
      });

      // Trigger file download
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `SalesData_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError("Excel export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>DTT Sales Data Inquiry</h1>
        <div style={styles.headerRight}>
          <span style={styles.userName}>{user.name || user.code}</span>
          <button
            style={styles.linkButton}
            onClick={() => navigate("/change-password")}
          >
            Change Password
          </button>
          <button style={styles.logoutButton} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Search Form */}
      <div style={styles.searchCard}>
        <form onSubmit={handleSearch} style={styles.searchForm}>
          <div style={styles.searchField}>
            <label style={styles.label}>Customer Code</label>
            <input
              style={styles.input}
              type="text"
              value={customerCode}
              onChange={(e) => setCustomerCode(e.target.value)}
              placeholder="Enter customer code"
            />
          </div>
          <div style={styles.searchField}>
            <label style={styles.label}>Goods Code</label>
            <input
              style={styles.input}
              type="text"
              value={goodsCode}
              onChange={(e) => setGoodsCode(e.target.value)}
              placeholder="Enter goods code"
            />
          </div>
          <div style={styles.searchActions}>
            <button style={styles.searchButton} type="submit" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </button>
            <button
              style={styles.exportButton}
              type="button"
              onClick={handleExport}
              disabled={exporting || !searched}
            >
              {exporting ? "Exporting..." : "Export to Excel"}
            </button>
          </div>
        </form>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Results Table */}
      {searched && (
        <div style={styles.tableContainer}>
          <div style={styles.resultCount}>
            {results.length} record{results.length !== 1 ? "s" : ""} found
          </div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Invoice No</th>
                <th style={styles.th}>Customer Code</th>
                <th style={styles.th}>Customer Name</th>
                <th style={styles.th}>Goods Code</th>
                <th style={styles.th}>Goods Name</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Sales Qty</th>
                <th style={{ ...styles.th, textAlign: "right" }}>
                  Sales Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td style={styles.td} colSpan={7}>
                    No data found
                  </td>
                </tr>
              ) : (
                results.map((row, idx) => (
                  <tr
                    key={idx}
                    style={idx % 2 === 0 ? styles.evenRow : undefined}
                  >
                    <td style={styles.td}>{row.INVOICE_NO}</td>
                    <td style={styles.td}>{row.CUSTOMERCODE}</td>
                    <td style={styles.td}>{row.CUSTOMERNAME}</td>
                    <td style={styles.td}>{row.GOODSCODE}</td>
                    <td style={styles.td}>{row.GOODSNAME}</td>
                    <td style={{ ...styles.td, textAlign: "right" }}>
                      {row.SALES_QTY?.toLocaleString()}
                    </td>
                    <td style={{ ...styles.td, textAlign: "right" }}>
                      {row.SALES_AMOUNT?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    paddingBottom: "16px",
    borderBottom: "2px solid #4472C4",
  },
  headerTitle: {
    color: "#333",
    fontSize: "22px",
    margin: 0,
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  userName: {
    fontWeight: "bold",
    color: "#555",
  },
  linkButton: {
    background: "none",
    border: "none",
    color: "#4472C4",
    cursor: "pointer",
    textDecoration: "underline",
    fontSize: "14px",
  },
  logoutButton: {
    padding: "6px 16px",
    backgroundColor: "#e74c3c",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
  },
  searchCard: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    marginBottom: "20px",
  },
  searchForm: {
    display: "flex",
    gap: "16px",
    alignItems: "flex-end",
    flexWrap: "wrap" as const,
  },
  searchField: {
    flex: "1",
    minWidth: "200px",
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
  searchActions: {
    display: "flex",
    gap: "8px",
  },
  searchButton: {
    padding: "10px 24px",
    backgroundColor: "#4472C4",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    fontSize: "14px",
    cursor: "pointer",
  },
  exportButton: {
    padding: "10px 24px",
    backgroundColor: "#27ae60",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    fontSize: "14px",
    cursor: "pointer",
  },
  error: {
    color: "#e74c3c",
    fontSize: "14px",
    marginBottom: "12px",
    padding: "10px",
    backgroundColor: "#fdecea",
    borderRadius: "4px",
  },
  tableContainer: {
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    overflow: "auto",
  },
  resultCount: {
    padding: "12px 16px",
    color: "#666",
    fontSize: "14px",
    borderBottom: "1px solid #eee",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "14px",
  },
  th: {
    backgroundColor: "#4472C4",
    color: "#fff",
    padding: "10px 12px",
    textAlign: "left" as const,
    fontWeight: "bold",
    whiteSpace: "nowrap" as const,
  },
  td: {
    padding: "8px 12px",
    borderBottom: "1px solid #eee",
  },
  evenRow: {
    backgroundColor: "#f8f9fa",
  },
};
