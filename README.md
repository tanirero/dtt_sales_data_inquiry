# DTT Sales Data Inquiry

A web application for mcframe GA sales staff to view their own sales data. Built to reduce user license costs while enforcing data access restrictions per employee.

## Features

- **Authentication**: Employee login using M_EMPLOYEE master (JWT + bcrypt)
- **First-time password setup**: Users set their password on initial login
- **Password change**: Users can update their password at any time
- **Sales data search**: Filter by Customer Code and Goods Code
- **Data access control**: Each user sees only their own sales data based on INCHARGECODE (FLEXMASTER3). Users with FLEXMASTER3 = 'ALL' can view all records
- **Excel export**: Download search results as .xlsx file

## Tech Stack

| Layer    | Technology                      |
| -------- | ------------------------------- |
| Frontend | Vite + React + TypeScript       |
| Backend  | Express + TypeScript            |
| Database | MSSQL Server (localhost\SQL2022) |
| Auth     | JWT + bcrypt                    |
| Excel    | ExcelJS                         |

## Project Structure

```
dtt_sales_data_inquiry/
├── client/                        # Frontend (Vite + React)
│   ├── src/
│   │   ├── api.ts                 # Axios instance with JWT interceptor
│   │   ├── App.tsx                # Router configuration
│   │   ├── main.tsx               # Entry point
│   │   └── components/
│   │       ├── LoginPage.tsx          # Login screen
│   │       ├── PasswordSetupPage.tsx  # First-time password setup
│   │       ├── PasswordChangePage.tsx # Change password
│   │       └── SalesSearchPage.tsx    # Sales data search & export
│   └── vite.config.ts             # Dev proxy → backend
├── server/                        # Backend (Express)
│   ├── src/
│   │   ├── index.ts               # Express server entry point
│   │   ├── db.ts                  # MSSQL connection pool
│   │   ├── auth.ts                # JWT middleware
│   │   └── routes/
│   │       ├── authRoutes.ts      # Login / password setup / change
│   │       └── salesRoutes.ts     # Sales search / Excel export
│   └── tsconfig.json
├── .env                           # Environment variables
└── Specification/                 # Design documents
```

## Prerequisites

- **Node.js** v18 or later
- **MSSQL Server** instance `localhost\SQL2022` with database `MCFGA_BIZ_DTT`
- **SQL Server Browser** service running (required for named instance connection)

## Setup

### 1. Configure environment variables

Edit `.env` in the project root:

```env
DB_SERVER=localhost\SQL2022
DB_NAME=MCFGA_BIZ_DTT
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_TRUST_SERVER_CERTIFICATE=true

JWT_SECRET=change-this-to-a-secure-random-string
PORT=3001
```

### 2. Install dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Start the application

Open two terminals:

**Terminal 1 - Start the backend server:**
```bash
cd server
npm run dev
```
The server starts on `http://localhost:3001`.

**Terminal 2 - Start the frontend dev server:**
```bash
cd client
npm run dev
```
The frontend starts on `http://localhost:5173`.

### 4. Open the application

Navigate to `http://localhost:5173` in your browser.

## Usage

### Login
1. Enter your employee code (M_EMPLOYEE.CODE) and password.
2. On first login, the system will prompt you to set a new password.

### Sales Data Search
1. After login, the sales search screen is displayed.
2. Enter optional filters: **Customer Code**, **Goods Code**.
3. Click **Search** to display results.
4. Click **Export to Excel** to download the results as an .xlsx file.

### Password Change
1. Click **Change Password** in the header.
2. Enter your current password and a new password (minimum 6 characters).

## API Endpoints

| Method | Endpoint                  | Auth | Description                    |
| ------ | ------------------------- | ---- | ------------------------------ |
| POST   | `/api/auth/login`         | No   | Login with employee code       |
| POST   | `/api/auth/setup-password`| No   | Set password on first login    |
| POST   | `/api/auth/change-password`| JWT | Change existing password       |
| GET    | `/api/sales`              | JWT  | Search sales data              |
| GET    | `/api/sales/export`       | JWT  | Export sales data to Excel     |
| GET    | `/api/health`             | No   | Health check                   |

## Database Tables Used

- **M_EMPLOYEE** - Employee master (authentication, data access control via FLEXMASTER3)
- **T_ACCTRANSACTIONH** - Sales transaction header
- **T_ACCTRANSACTIOND** - Sales transaction detail
- **M_CORRESPONDENT** - Customer master (for customer name lookup)
- **M_GOODS** - Goods master (for goods name lookup)
