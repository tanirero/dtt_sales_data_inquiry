import { Router, Request, Response } from "express";
import ExcelJS from "exceljs";
import { getPool } from "../db";
import { authMiddleware } from "../auth";

const router = Router();

// Build the sales query with filtering logic
function buildSalesQuery(
  flexmaster3: string,
  customerCode?: string,
  goodsCode?: string
): { query: string; params: Record<string, string> } {
  const params: Record<string, string> = {};

  let query = `
    SELECT
      H.VOUCHERNO    AS INVOICE_NO,
      H.CUSTOMERCODE AS CUSTOMERCODE,
      C.NAME         AS CUSTOMERNAME,
      D.GOODSCODE    AS GOODSCODE,
      G.NAME         AS GOODSNAME,
      D.QTY_MINUS - D.QTY_PLUS AS SALES_QTY,
      D.TAXABLEAMOUNT_SC       AS SALES_AMOUNT
    FROM T_ACCTRANSACTIONH H
    JOIN T_ACCTRANSACTIOND D
      ON H.COMPANY = D.COMPANY
     AND H.INTERNALNO = D.INTERNALNO
     AND H.SLIPTYPE = D.SLIPTYPE
    LEFT JOIN M_CORRESPONDENT C
      ON H.COMPANY = C.COMPANY
     AND C.LANG = 'en-US'
     AND H.CUSTOMERCODE = C.CODE
    LEFT JOIN M_GOODS G
      ON D.COMPANY = G.COMPANY
     AND G.LANG = 'en-US'
     AND D.GOODSCODE = G.CODE
    WHERE H.COMPANY = 'DTT'
  `;

  // Data access control based on FLEXMASTER3
  if (flexmaster3 !== "ALL") {
    query += ` AND H.INCHARGECODE LIKE @flexmaster3Pattern`;
    params.flexmaster3Pattern = `${flexmaster3}%`;
  }

  // Optional search filters
  if (customerCode) {
    query += ` AND H.CUSTOMERCODE LIKE @customerCode`;
    params.customerCode = `%${customerCode}%`;
  }

  if (goodsCode) {
    query += ` AND D.GOODSCODE LIKE @goodsCode`;
    params.goodsCode = `%${goodsCode}%`;
  }

  query += ` ORDER BY H.VOUCHERNO, D.GOODSCODE`;

  return { query, params };
}

// GET /api/sales - Search sales data
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const customerCode = req.query.customerCode as string | undefined;
    const goodsCode = req.query.goodsCode as string | undefined;
    const flexmaster3 = req.user!.flexmaster3;

    const { query, params } = buildSalesQuery(
      flexmaster3,
      customerCode,
      goodsCode
    );

    const pool = await getPool();
    const request = pool.request();

    // Bind parameters
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value);
    }

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error("Sales search error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/sales/export - Export sales data to Excel
router.get("/export", authMiddleware, async (req: Request, res: Response) => {
  try {
    const customerCode = req.query.customerCode as string | undefined;
    const goodsCode = req.query.goodsCode as string | undefined;
    const flexmaster3 = req.user!.flexmaster3;

    const { query, params } = buildSalesQuery(
      flexmaster3,
      customerCode,
      goodsCode
    );

    const pool = await getPool();
    const request = pool.request();

    for (const [key, value] of Object.entries(params)) {
      request.input(key, value);
    }

    const result = await request.query(query);

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Data");

    // Define columns
    worksheet.columns = [
      { header: "Invoice No", key: "INVOICE_NO", width: 15 },
      { header: "Customer Code", key: "CUSTOMERCODE", width: 15 },
      { header: "Customer Name", key: "CUSTOMERNAME", width: 30 },
      { header: "Goods Code", key: "GOODSCODE", width: 15 },
      { header: "Goods Name", key: "GOODSNAME", width: 30 },
      { header: "Sales Qty", key: "SALES_QTY", width: 12 },
      { header: "Sales Amount", key: "SALES_AMOUNT", width: 15 },
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };

    // Add data rows
    for (const row of result.recordset) {
      worksheet.addRow(row);
    }

    // Set response headers
    const filename = `SalesData_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Excel export error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
