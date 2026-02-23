import sql from "mssql";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const config: sql.config = {
  server: process.env.DB_SERVER || "localhost\\SQL2022",
  database: process.env.DB_NAME || "MCFGA_BIZ_DTT",
  user: process.env.DB_USER || undefined,
  password: process.env.DB_PASSWORD || undefined,
  options: {
    trustServerCertificate:
      process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
    encrypt: false,
    instanceName: "SQL2022",
  },
  port: undefined, // Named instance uses dynamic port via SQL Browser
};

// Remove instanceName from options and use server without instance
// mssql package handles "server\\instance" format automatically
if (config.server?.includes("\\")) {
  const parts = config.server.split("\\");
  config.server = parts[0];
  config.options!.instanceName = parts[1];
}

let pool: sql.ConnectionPool | null = null;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = await new sql.ConnectionPool(config).connect();
    console.log("Connected to MSSQL database");
  }
  return pool;
}

export default sql;
