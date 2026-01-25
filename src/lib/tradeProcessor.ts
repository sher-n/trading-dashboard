// Trade matching and processing logic
import { getSqliteDb, saveDb } from "./db";

interface CsvRow {
  Symbol: string;
  Side: string;
  Type: string;
  Qty: string;
  "Filled Qty": string;
  "Limit Price": string;
  "Stop Price": string;
  "Take Profit": string;
  "Stop Loss": string;
  "Avg Fill Price": string;
  "Update Time": string;
  "Order ID": string;
  Expiry: string;
  "Position ID": string;
  Commission: string;
  "Closed P&L": string;
  "Net Closed P&L": string;
  "Expiry Time": string;
}

interface OrderData {
  symbol: string;
  side: string;
  orderType: string;
  qty: number;
  filledQty: number;
  limitPrice: number | null;
  stopPrice: number | null;
  takeProfit: number | null;
  stopLoss: number | null;
  avgFillPrice: number;
  updateTime: string;
  orderId: string;
  expiry: string | null;
  positionId: string;
  commission: number;
  closedPnl: number | null;
  netClosedPnl: number | null;
  expiryTime: string | null;
}

// Parse CSV row to order data
function parseRow(row: CsvRow): OrderData {
  return {
    symbol: row.Symbol,
    side: row.Side,
    orderType: row.Type,
    qty: parseFloat(row.Qty) || 0,
    filledQty: parseFloat(row["Filled Qty"]) || 0,
    limitPrice: row["Limit Price"] ? parseFloat(row["Limit Price"]) : null,
    stopPrice: row["Stop Price"] ? parseFloat(row["Stop Price"]) : null,
    takeProfit: row["Take Profit"] ? parseFloat(row["Take Profit"]) : null,
    stopLoss: row["Stop Loss"] ? parseFloat(row["Stop Loss"]) : null,
    avgFillPrice: parseFloat(row["Avg Fill Price"]) || 0,
    updateTime: row["Update Time"],
    orderId: row["Order ID"],
    expiry: row.Expiry || null,
    positionId: row["Position ID"],
    commission: parseFloat(row.Commission) || 0,
    closedPnl: row["Closed P&L"] ? parseFloat(row["Closed P&L"]) : null,
    netClosedPnl: row["Net Closed P&L"] ? parseFloat(row["Net Closed P&L"]) : null,
    expiryTime: row["Expiry Time"] || null,
  };
}

// Convert date string to ISO format
function parseDate(dateStr: string): string {
  // Format: "2026-01-23 20:23:50"
  const [datePart, timePart] = dateStr.split(" ");
  return `${datePart}T${timePart}`;
}

// Process CSV data and import to database
export async function processCSV(rows: CsvRow[], filename: string): Promise<{
  orderCount: number;
  tradeCount: number;
}> {
  const db = await getSqliteDb();

  // Insert orders
  const insertOrder = db.prepare(`
    INSERT OR IGNORE INTO orders (
      symbol, side, order_type, qty, filled_qty, limit_price, stop_price,
      take_profit, stop_loss, avg_fill_price, update_time, order_id, expiry,
      position_id, commission, closed_pnl, net_closed_pnl, expiry_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let orderCount = 0;
  const orders: OrderData[] = [];

  for (const row of rows) {
    if (!row.Symbol || !row["Order ID"]) continue;

    const order = parseRow(row);
    orders.push(order);

    try {
      insertOrder.run([
        order.symbol,
        order.side,
        order.orderType,
        order.qty,
        order.filledQty,
        order.limitPrice,
        order.stopPrice,
        order.takeProfit,
        order.stopLoss,
        order.avgFillPrice,
        parseDate(order.updateTime),
        order.orderId,
        order.expiry,
        order.positionId,
        order.commission,
        order.closedPnl,
        order.netClosedPnl,
        order.expiryTime,
      ]);
      orderCount++;
    } catch (e) {
      // Ignore duplicate orders
    }
  }

  insertOrder.free();

  // Match trades
  const tradeCount = await matchTrades(orders);

  // Record import
  db.run(
    "INSERT INTO imports (filename, order_count, trade_count) VALUES (?, ?, ?)",
    [filename, orderCount, tradeCount]
  );

  await saveDb();

  return { orderCount, tradeCount };
}

// Match entry and exit orders into trades
async function matchTrades(orders: OrderData[]): Promise<number> {
  const db = await getSqliteDb();

  // Group orders by position ID
  const positionMap = new Map<string, OrderData[]>();

  for (const order of orders) {
    const existing = positionMap.get(order.positionId) || [];
    existing.push(order);
    positionMap.set(order.positionId, existing);
  }

  const insertTrade = db.prepare(`
    INSERT INTO trades (
      position_id, symbol, direction, entry_time, exit_time, entry_price,
      exit_price, qty, pnl, commission, net_pnl, duration_seconds, exit_type, is_closed
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let tradeCount = 0;

  for (const [positionId, positionOrders] of positionMap) {
    // Find the order with closed PnL - skip positions without PnL
    const pnlOrder = positionOrders.find(o => o.closedPnl !== null);
    if (!pnlOrder) {
      // Skip positions with no closed PnL (e.g., pending TP/SL orders)
      continue;
    }

    // Sort by time
    positionOrders.sort((a, b) =>
      new Date(a.updateTime).getTime() - new Date(b.updateTime).getTime()
    );

    // Find entry order (first order in position)
    const entryOrder = positionOrders[0];

    // Determine direction based on entry side
    const direction = entryOrder.side === "Buy" ? "Long" : "Short";

    // Find exit order (order with closed PnL or opposite side)
    const exitOrder = positionOrders.find(o =>
      o.closedPnl !== null ||
      (direction === "Long" && o.side === "Sell") ||
      (direction === "Short" && o.side === "Buy")
    );

    // Calculate commission (sum all commissions for this position)
    const totalCommission = positionOrders.reduce((sum, o) => sum + (o.commission || 0), 0);

    // Calculate duration
    let durationSeconds: number | null = null;
    if (exitOrder) {
      const entryTime = new Date(entryOrder.updateTime).getTime();
      const exitTime = new Date(exitOrder.updateTime).getTime();
      durationSeconds = Math.floor((exitTime - entryTime) / 1000);
    }

    const pnl = pnlOrder.closedPnl;
    const netPnl = pnl !== null ? pnl + totalCommission : null;

    // Determine exit type
    let exitType: string | null = null;
    if (exitOrder) {
      if (exitOrder.orderType === "Stop Loss") exitType = "Stop Loss";
      else if (exitOrder.orderType === "Take Profit") exitType = "Take Profit";
      else exitType = "Manual";
    }

    // Check if this trade already exists
    const existing = db.exec(
      "SELECT id FROM trades WHERE position_id = ?",
      [positionId]
    );

    if (existing.length === 0 || existing[0].values.length === 0) {
      insertTrade.run([
        positionId,
        entryOrder.symbol,
        direction,
        parseDate(entryOrder.updateTime),
        exitOrder ? parseDate(exitOrder.updateTime) : null,
        entryOrder.avgFillPrice,
        exitOrder?.avgFillPrice ?? null,
        entryOrder.qty,
        pnl,
        totalCommission,
        netPnl,
        durationSeconds,
        exitType,
        exitOrder ? 1 : 0,
      ]);
      tradeCount++;
    }
  }

  insertTrade.free();
  return tradeCount;
}

// Calculate trading statistics
export async function calculateStats(): Promise<TradingStats> {
  const db = await getSqliteDb();

  // Get all closed trades sorted by exit time
  const result = db.exec(`
    SELECT * FROM trades
    WHERE is_closed = 1 AND pnl IS NOT NULL
    ORDER BY exit_time ASC
  `);

  if (result.length === 0 || result[0].values.length === 0) {
    return getEmptyStats();
  }

  const columns = result[0].columns;
  const trades = result[0].values.map(row => {
    const trade: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      trade[col] = row[i];
    });
    return trade;
  });

  // Calculate metrics
  const pnls = trades.map(t => t.pnl as number);
  const netPnls = trades.map(t => t.net_pnl as number);
  const durations = trades.map(t => t.duration_seconds as number).filter(d => d !== null);

  const wins = pnls.filter(p => p > 0);
  const losses = pnls.filter(p => p < 0);

  // Calculate streaks
  let currentWinStreak = 0;
  let currentLoseStreak = 0;
  let maxWinStreak = 0;
  let maxLoseStreak = 0;

  for (const pnl of pnls) {
    if (pnl > 0) {
      currentWinStreak++;
      currentLoseStreak = 0;
      maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
    } else if (pnl < 0) {
      currentLoseStreak++;
      currentWinStreak = 0;
      maxLoseStreak = Math.max(maxLoseStreak, currentLoseStreak);
    }
  }

  // Calculate cumulative PnL for chart
  let cumPnl = 0;
  let maxEquity = 0;
  let minEquity = 0;
  const pnlCurve = trades.map(t => {
    cumPnl += (t.net_pnl as number) || (t.pnl as number) || 0;
    maxEquity = Math.max(maxEquity, cumPnl);
    minEquity = Math.min(minEquity, cumPnl);
    return {
      time: t.exit_time as string,
      pnl: cumPnl,
      symbol: t.symbol as string,
    };
  });

  // Group by symbol
  const symbolStats = new Map<string, { wins: number; losses: number; pnl: number }>();
  for (const trade of trades) {
    const symbol = trade.symbol as string;
    const existing = symbolStats.get(symbol) || { wins: 0, losses: 0, pnl: 0 };
    const pnl = (trade.pnl as number) || 0;
    existing.pnl += pnl;
    if (pnl > 0) existing.wins++;
    else if (pnl < 0) existing.losses++;
    symbolStats.set(symbol, existing);
  }

  const grossProfit = wins.reduce((a, b) => a + b, 0);
  const grossLoss = Math.abs(losses.reduce((a, b) => a + b, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  // Calculate average trades per day
  const tradeDates = new Set(
    trades.map(t => (t.exit_time as string).split("T")[0])
  );
  const tradingDays = tradeDates.size;
  const avgTradesPerDay = tradingDays > 0 ? trades.length / tradingDays : 0;

  return {
    totalTrades: trades.length,
    avgTradesPerDay,
    winningTrades: wins.length,
    losingTrades: losses.length,
    winRate: trades.length > 0 ? (wins.length / trades.length) * 100 : 0,
    totalPnl: pnls.reduce((a, b) => a + b, 0),
    totalNetPnl: netPnls.reduce((a, b) => a + b, 0),
    maxProfit: Math.max(...pnls, 0),
    maxLoss: Math.min(...pnls, 0),
    avgProfit: wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0,
    avgLoss: losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0,
    maxWinStreak,
    maxLoseStreak,
    currentWinStreak,
    currentLoseStreak,
    avgDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
    minDuration: durations.length > 0 ? Math.min(...durations) : 0,
    maxDuration: durations.length > 0 ? Math.max(...durations) : 0,
    profitFactor,
    maxEquity,
    minEquity,
    pnlCurve,
    symbolStats: Object.fromEntries(symbolStats),
  };
}

export interface TradingStats {
  totalTrades: number;
  avgTradesPerDay: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnl: number;
  totalNetPnl: number;
  maxProfit: number;
  maxLoss: number;
  avgProfit: number;
  avgLoss: number;
  maxWinStreak: number;
  maxLoseStreak: number;
  currentWinStreak: number;
  currentLoseStreak: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  profitFactor: number;
  maxEquity: number;
  minEquity: number;
  pnlCurve: Array<{ time: string; pnl: number; symbol: string }>;
  symbolStats: Record<string, { wins: number; losses: number; pnl: number }>;
}

function getEmptyStats(): TradingStats {
  return {
    totalTrades: 0,
    avgTradesPerDay: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    totalPnl: 0,
    totalNetPnl: 0,
    maxProfit: 0,
    maxLoss: 0,
    avgProfit: 0,
    avgLoss: 0,
    maxWinStreak: 0,
    maxLoseStreak: 0,
    currentWinStreak: 0,
    currentLoseStreak: 0,
    avgDuration: 0,
    minDuration: 0,
    maxDuration: 0,
    profitFactor: 0,
    maxEquity: 0,
    minEquity: 0,
    pnlCurve: [],
    symbolStats: {},
  };
}

// Get all trades
export async function getAllTrades() {
  const db = await getSqliteDb();
  const result = db.exec(`
    SELECT * FROM trades
    ORDER BY exit_time DESC
  `);

  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map(row => {
    const trade: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      trade[col] = row[i];
    });
    return trade;
  });
}
