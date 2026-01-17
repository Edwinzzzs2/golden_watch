import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const DEFAULT_SCRAPER_URL =
  'https://lsjr.ccb.com/msmp/ecpweb/page/internet/dist/preciousMetalsDetail.html?CCB_EmpID=71693716&PM_PD_ID=261108522&Org_Inst_Rgon_Cd=JS&page=preciousMetalsDetail';

let initialized = false;

async function initDb() {
  if (!initialized) {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS gold_prices (
          id SERIAL PRIMARY KEY,
          price NUMERIC(10, 2) NOT NULL,
          unit VARCHAR(50) NOT NULL,
          timestamp TIMESTAMPTZ NOT NULL
        );
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS scraper_config (
          id SERIAL PRIMARY KEY,
          name VARCHAR(50) UNIQUE NOT NULL,
          value TEXT NOT NULL
        );
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_gold_prices_timestamp 
        ON gold_prices(timestamp DESC);
      `);
      initialized = true;
      console.log('Database initialized successfully');
    } catch (error: any) {
      if (error?.code === '23505') {
        console.warn('Database initialization race detected, continuing:', error.detail || error.message);
        initialized = true;
      } else {
        console.error('Database initialization error:', error);
        throw error;
      }
    } finally {
      client.release();
    }
  }
}

export interface GoldPriceRow {
  id: number;
  price: number;
  unit: string;
  timestamp: string;
}

export interface CronConfig {
  enabled: boolean;
  expression: string | null;
}

export async function getScraperUrl(): Promise<string> {
  await initDb();
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT value FROM scraper_config WHERE name = $1 LIMIT 1',
      ['scrape_url'],
    );
    if (result.rows.length > 0 && result.rows[0].value) {
      return result.rows[0].value as string;
    }
    await client.query(
      'INSERT INTO scraper_config (name, value) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
      ['scrape_url', DEFAULT_SCRAPER_URL],
    );
    return DEFAULT_SCRAPER_URL;
  } finally {
    client.release();
  }
}

export async function updateScraperUrl(url: string): Promise<string> {
  await initDb();
  const client = await pool.connect();
  try {
    await client.query(
      'INSERT INTO scraper_config (name, value) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET value = EXCLUDED.value',
      ['scrape_url', url],
    );
    return url;
  } finally {
    client.release();
  }
}

export async function getCronConfig(): Promise<CronConfig> {
  await initDb();
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT name, value FROM scraper_config WHERE name = ANY($1)',
      [['cron_enabled', 'cron_expression']],
    );
    let enabled = false;
    let expression: string | null = null;
    for (const row of result.rows) {
      if (row.name === 'cron_enabled') {
        enabled = row.value === 'true';
      }
      if (row.name === 'cron_expression') {
        expression = row.value || null;
      }
    }
    return { enabled, expression };
  } finally {
    client.release();
  }
}

export async function saveCronConfig(
  enabled: boolean,
  expression: string | null,
): Promise<void> {
  await initDb();
  const client = await pool.connect();
  try {
    console.log('[cron-config] saveCronConfig called', {
      enabled,
      expression,
    });
    await client.query(
      'INSERT INTO scraper_config (name, value) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET value = EXCLUDED.value',
      ['cron_enabled', enabled ? 'true' : 'false'],
    );
    await client.query(
      'INSERT INTO scraper_config (name, value) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET value = EXCLUDED.value',
      ['cron_expression', expression ?? ''],
    );
  } finally {
    client.release();
  }
}

export async function addGoldPrice(price: number, unit: string, timestamp: string): Promise<GoldPriceRow> {
  await initDb();
  const client = await pool.connect();
  try {
    const result = await client.query(
      'INSERT INTO gold_prices (price, unit, timestamp) VALUES ($1, $2, $3) RETURNING *',
      [price, unit, timestamp]
    );
    return {
      id: result.rows[0].id,
      price: parseFloat(result.rows[0].price),
      unit: result.rows[0].unit,
      timestamp: result.rows[0].timestamp,
    };
  } finally {
    client.release();
  }
}

export async function getGoldHistory(limit: number = 100): Promise<GoldPriceRow[]> {
  await initDb();
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT id, price, unit, timestamp FROM gold_prices ORDER BY id DESC LIMIT $1',
      [limit]
    );
    return result.rows.map(row => ({
      id: row.id,
      price: parseFloat(row.price),
      unit: row.unit,
      timestamp: row.timestamp,
    }));
  } finally {
    client.release();
  }
}

export async function getGoldHistoryByDays(days: number | null = null): Promise<GoldPriceRow[]> {
  await initDb();
  const client = await pool.connect();
  try {
    let query: string;
    let params: any[];

    if (days === null) {
      // Get all records
      query = 'SELECT id, price, unit, timestamp FROM gold_prices ORDER BY timestamp DESC';
      params = [];
    } else {
      // Get records from the last N days
      query = `
        SELECT id, price, unit, timestamp 
        FROM gold_prices 
        WHERE timestamp >= NOW() - INTERVAL '${days} days'
        ORDER BY timestamp DESC
      `;
      params = [];
    }

    const result = await client.query(query, params);
    return result.rows.map(row => ({
      id: row.id,
      price: parseFloat(row.price),
      unit: row.unit,
      timestamp: row.timestamp,
    }));
  } finally {
    client.release();
  }
}

export async function getLatestGoldPrice(): Promise<GoldPriceRow | null> {
  const list = await getGoldHistory(1);
  return list.length > 0 ? list[0] : null;
}
