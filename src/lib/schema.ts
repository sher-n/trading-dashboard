// Drizzle ORM Schema for Trading Dashboard
import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";

// Raw orders table - stores CSV data exactly as imported
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  symbol: text("symbol").notNull(),
  side: text("side").notNull(), // Buy, Sell
  orderType: text("order_type").notNull(), // Market, Limit, Stop Loss, Take Profit
  qty: real("qty").notNull(),
  filledQty: real("filled_qty").notNull(),
  limitPrice: real("limit_price"),
  stopPrice: real("stop_price"),
  takeProfit: real("take_profit"),
  stopLoss: real("stop_loss"),
  avgFillPrice: real("avg_fill_price").notNull(),
  updateTime: text("update_time").notNull(), // ISO string
  orderId: text("order_id").notNull().unique(),
  expiry: text("expiry"),
  positionId: text("position_id").notNull(),
  commission: real("commission").default(0),
  closedPnl: real("closed_pnl"),
  netClosedPnl: real("net_closed_pnl"),
  expiryTime: text("expiry_time"),
  createdAt: text("created_at").default(new Date().toISOString()),
});

// Computed trades table - matched entry/exit pairs
export const trades = sqliteTable("trades", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  positionId: text("position_id").notNull(),
  symbol: text("symbol").notNull(),
  direction: text("direction").notNull(), // Long, Short
  entryTime: text("entry_time").notNull(),
  exitTime: text("exit_time"),
  entryPrice: real("entry_price").notNull(),
  exitPrice: real("exit_price"),
  qty: real("qty").notNull(),
  pnl: real("pnl"),
  commission: real("commission").default(0),
  netPnl: real("net_pnl"),
  durationSeconds: integer("duration_seconds"),
  exitType: text("exit_type"), // Stop Loss, Take Profit, Manual
  isClosed: integer("is_closed", { mode: "boolean" }).default(false),
});

// Import sessions table - track CSV uploads
export const imports = sqliteTable("imports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  filename: text("filename").notNull(),
  importedAt: text("imported_at").default(new Date().toISOString()),
  orderCount: integer("order_count"),
  tradeCount: integer("trade_count"),
});

// TypeScript types
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type Trade = typeof trades.$inferSelect;
export type NewTrade = typeof trades.$inferInsert;
export type Import = typeof imports.$inferSelect;
