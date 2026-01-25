// Database connection using sql.js (pure JavaScript SQLite)
import initSqlJs, { Database } from "sql.js";
import { drizzle } from "drizzle-orm/sql-js";
import * as schema from "./schema";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "trading.db");

let db: ReturnType<typeof drizzle> | null = null;
let sqliteDb: Database | null = null;

// Initialize the database
export async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs({
    locateFile: (file) => path.join(process.cwd(), "node_modules", "sql.js", "dist", file),
  });

  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    sqliteDb = new SQL.Database(fileBuffer);
  } else {
    sqliteDb = new SQL.Database();
  }

  db = drizzle(sqliteDb, { schema });

  // Create tables if they don't exist
  await initTables();

  return db;
}

// Get the raw SQLite database for direct queries
export async function getSqliteDb() {
  if (!sqliteDb) {
    await getDb();
  }
  return sqliteDb!;
}

// Save database to disk
export async function saveDb() {
  if (sqliteDb) {
    const data = sqliteDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// Initialize tables
async function initTables() {
  if (!sqliteDb) return;

  // Create orders table
  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      side TEXT NOT NULL,
      order_type TEXT NOT NULL,
      qty REAL NOT NULL,
      filled_qty REAL NOT NULL,
      limit_price REAL,
      stop_price REAL,
      take_profit REAL,
      stop_loss REAL,
      avg_fill_price REAL NOT NULL,
      update_time TEXT NOT NULL,
      order_id TEXT NOT NULL UNIQUE,
      expiry TEXT,
      position_id TEXT NOT NULL,
      commission REAL DEFAULT 0,
      closed_pnl REAL,
      net_closed_pnl REAL,
      expiry_time TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create trades table
  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      position_id TEXT NOT NULL,
      symbol TEXT NOT NULL,
      direction TEXT NOT NULL,
      entry_time TEXT NOT NULL,
      exit_time TEXT,
      entry_price REAL NOT NULL,
      exit_price REAL,
      qty REAL NOT NULL,
      pnl REAL,
      commission REAL DEFAULT 0,
      net_pnl REAL,
      duration_seconds INTEGER,
      exit_type TEXT,
      is_closed INTEGER DEFAULT 0
    )
  `);

  // Create imports table
  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS imports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      imported_at TEXT DEFAULT CURRENT_TIMESTAMP,
      order_count INTEGER,
      trade_count INTEGER
    )
  `);

  // Create indexes for better performance
  sqliteDb.run(`CREATE INDEX IF NOT EXISTS idx_orders_position_id ON orders(position_id)`);
  sqliteDb.run(`CREATE INDEX IF NOT EXISTS idx_orders_update_time ON orders(update_time)`);
  sqliteDb.run(`CREATE INDEX IF NOT EXISTS idx_trades_exit_time ON trades(exit_time)`);
  sqliteDb.run(`CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol)`);

  await saveDb();
}

// Clear all data (for re-importing)
export async function clearAllData() {
  const sqlite = await getSqliteDb();
  sqlite.run("DELETE FROM orders");
  sqlite.run("DELETE FROM trades");
  sqlite.run("DELETE FROM imports");
  await saveDb();
}
