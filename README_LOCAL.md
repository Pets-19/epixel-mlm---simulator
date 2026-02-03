# Running Locally Without Docker

To run the EPIXEL MLM Simulator locally, follow these steps.

## Prerequisites
1.  **Node.js**: Installed (Verified).
2.  **PostgreSQL**: Must be installed and running.
3.  **Go**: Must be installed to run the `genealogy-simulator` backend.

## 1. Configuration
A `.env` file has been created in the root directory.
**Action Required**: Open `.env` and update the `DB_USER` and `DB_PASSWORD` fields to match your local PostgreSQL credentials.

## 2. Database Initialization
Once you have updated the `.env` file with correct credentials, run the initialization script to create the database and tables:

```bash
node scripts/init-local-db.js
```

## 3. Run the Backend (Genealogy Simulator)
Open a new terminal, navigate to `genealogy-simulator`, and run the Go service:

```bash
cd genealogy-simulator
go run main.go
```
*Note: This service connects to the database, so ensure step 2 is complete.*

## 4. Run the Frontend (Next.js App)
In the root directory, start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
