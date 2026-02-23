import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { getPool } from "../db";
import { generateToken, authMiddleware } from "../auth";

const router = Router();
const SALT_ROUNDS = 10;

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { code, password } = req.body;
    if (!code || !password) {
      res.status(400).json({ error: "User code and password are required" });
      return;
    }

    const pool = await getPool();
    const result = await pool
      .request()
      .input("code", code)
      .query(
        `SELECT CODE, NAME, FLEXTEXT3, FLEXMASTER3
         FROM M_EMPLOYEE
         WHERE COMPANY = 'DTT'
           AND LANG = 'en-US'
           AND FLEXMASTER1 = '1'
           AND CODE = @code`
      );

    if (result.recordset.length === 0) {
      res.status(401).json({ error: "Invalid user code" });
      return;
    }

    const employee = result.recordset[0];

    // Check if password has been set (FLEXTEXT3)
    if (!employee.FLEXTEXT3) {
      res.json({ needsPasswordSetup: true, code: employee.CODE });
      return;
    }

    // Verify password
    const isValid = await bcrypt.compare(password, employee.FLEXTEXT3);
    if (!isValid) {
      res.status(401).json({ error: "Invalid password" });
      return;
    }

    const token = generateToken({
      code: employee.CODE,
      name: employee.NAME,
      flexmaster3: employee.FLEXMASTER3 || "",
    });

    res.json({
      token,
      user: {
        code: employee.CODE,
        name: employee.NAME,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/setup-password
router.post("/setup-password", async (req: Request, res: Response) => {
  try {
    const { code, password } = req.body;
    if (!code || !password) {
      res.status(400).json({ error: "User code and password are required" });
      return;
    }

    if (password.length < 6) {
      res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
      return;
    }

    const pool = await getPool();

    // Verify employee exists and has no password set
    const check = await pool
      .request()
      .input("code", code)
      .query(
        `SELECT CODE, NAME, FLEXTEXT3, FLEXMASTER3
         FROM M_EMPLOYEE
         WHERE COMPANY = 'DTT'
           AND LANG = 'en-US'
           AND FLEXMASTER1 = '1'
           AND CODE = @code`
      );

    if (check.recordset.length === 0) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    const employee = check.recordset[0];
    if (employee.FLEXTEXT3) {
      res.status(400).json({ error: "Password already set. Please login." });
      return;
    }

    // Hash and save password
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    await pool
      .request()
      .input("hash", hash)
      .input("code", code)
      .query(
        `UPDATE M_EMPLOYEE
         SET FLEXTEXT3 = @hash
         WHERE COMPANY = 'DTT'
           AND LANG = 'en-US'
           AND FLEXMASTER1 = '1'
           AND CODE = @code`
      );

    const token = generateToken({
      code: employee.CODE,
      name: employee.NAME,
      flexmaster3: employee.FLEXMASTER3 || "",
    });

    res.json({
      token,
      user: {
        code: employee.CODE,
        name: employee.NAME,
      },
    });
  } catch (err) {
    console.error("Setup password error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/change-password
router.post(
  "/change-password",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        res
          .status(400)
          .json({ error: "Current and new passwords are required" });
        return;
      }

      if (newPassword.length < 6) {
        res
          .status(400)
          .json({ error: "New password must be at least 6 characters" });
        return;
      }

      const pool = await getPool();
      const result = await pool
        .request()
        .input("code", req.user!.code)
        .query(
          `SELECT FLEXTEXT3
           FROM M_EMPLOYEE
           WHERE COMPANY = 'DTT'
             AND LANG = 'en-US'
             AND FLEXMASTER1 = '1'
             AND CODE = @code`
        );

      if (result.recordset.length === 0) {
        res.status(404).json({ error: "Employee not found" });
        return;
      }

      const employee = result.recordset[0];

      // Verify current password
      const isValid = await bcrypt.compare(
        currentPassword,
        employee.FLEXTEXT3
      );
      if (!isValid) {
        res.status(401).json({ error: "Current password is incorrect" });
        return;
      }

      // Update password
      const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
      await pool
        .request()
        .input("hash", hash)
        .input("code", req.user!.code)
        .query(
          `UPDATE M_EMPLOYEE
           SET FLEXTEXT3 = @hash
           WHERE COMPANY = 'DTT'
             AND LANG = 'en-US'
             AND FLEXMASTER1 = '1'
             AND CODE = @code`
        );

      res.json({ message: "Password changed successfully" });
    } catch (err) {
      console.error("Change password error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
