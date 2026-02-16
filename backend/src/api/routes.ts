import { Router, Request, Response } from 'express';
import { DatabaseConnection } from '../db/connection';
import { DatabaseIntrospector } from '../db/introspector';
import { PIIDetector } from '../anonymizer/pii-detector';
import { ConnectionConfig } from '../db/types';

const router = Router();

// Store active connection (in-memory for MVP, should be session-based in production)
let activeConnection: DatabaseConnection | null = null;
let activeDbType: 'postgres' | 'mysql' | null = null;

/**
 * POST /api/connect
 * Connect to a database
 */
router.post('/connect', async (req: Request, res: Response) => {
  try {
    const config: ConnectionConfig = req.body;

    // Validate config
    if (!config.type || !config.host || !config.database || !config.user) {
      return res.status(400).json({ error: 'Missing required connection parameters' });
    }

    // Disconnect existing connection if any
    if (activeConnection) {
      await activeConnection.disconnect();
    }

    // Create new connection
    activeConnection = new DatabaseConnection();
    await activeConnection.connect(config);
    activeDbType = config.type;

    res.json({ 
      success: true, 
      message: `Connected to ${config.type} database: ${config.database}` 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/disconnect
 * Disconnect from database
 */
router.post('/disconnect', async (_req: Request, res: Response) => {
  try {
    if (activeConnection) {
      await activeConnection.disconnect();
      activeConnection = null;
      activeDbType = null;
    }

    res.json({ success: true, message: 'Disconnected from database' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/schema
 * Get database schema with PII detection
 */
router.get('/schema', async (_req: Request, res: Response) => {
  try {
    if (!activeConnection || !activeDbType) {
      return res.status(400).json({ error: 'No active database connection' });
    }

    const knex = activeConnection.getKnex();
    const introspector = new DatabaseIntrospector(knex, activeDbType);
    const schema = await introspector.getSchema();

    // Detect PII for each table
    const schemaWithPII = {
      tables: schema.tables.map(table => {
        const piiDetection = PIIDetector.detectPII(table.columns);
        return {
          ...table,
          piiDetection,
        };
      }),
    };

    res.json(schemaWithPII);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/connection-status
 * Check if database is connected
 */
router.get('/connection-status', (_req: Request, res: Response) => {
  res.json({
    connected: activeConnection?.isConnected() || false,
    dbType: activeDbType,
  });
});

export default router;
