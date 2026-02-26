import { DatabaseConnection } from './connection';

// Store connections in memory (for MVP)
// This needs to be in a separate file to avoid circular dependencies
// and issues with Next.js route handler exports
export const connections = new Map<string, DatabaseConnection>();
