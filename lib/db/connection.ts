import knex, { Knex } from 'knex';
import { ConnectionConfig } from './types';

export class DatabaseConnection {
  private knexInstance: Knex | null = null;

  async connect(config: ConnectionConfig): Promise<void> {
    const knexConfig: Knex.Config = {
      client: config.type === 'postgres' ? 'pg' : 'mysql2',
      connection: {
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
      },
    };

    this.knexInstance = knex(knexConfig);

    try {
      await this.knexInstance.raw('SELECT 1');
    } catch (error) {
      this.knexInstance = null;
      throw new Error(`Failed to connect to database: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.knexInstance) {
      await this.knexInstance.destroy();
      this.knexInstance = null;
    }
  }

  getKnex(): Knex {
    if (!this.knexInstance) {
      throw new Error('Database not connected');
    }
    return this.knexInstance;
  }

  isConnected(): boolean {
    return this.knexInstance !== null;
  }
}
