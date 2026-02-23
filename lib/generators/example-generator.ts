import { DatabaseSchema, TableInfo } from '@/lib/api';

export interface SmartExample {
  title: string;
  description: string;
  prompt: string;
  category: 'basic' | 'qa' | 'advanced';
  relevance: number;
}

export class ExampleGenerator {
  /**
   * Generate contextual examples based on the database schema
   */
  static generateExamples(schema: DatabaseSchema): SmartExample[] {
    const examples: SmartExample[] = [];
    const tables = schema.tables;

    // Detect common table patterns
    const userTable = this.findTable(tables, ['user', 'users', 'customer', 'customers', 'account']);
    const orderTable = this.findTable(tables, ['order', 'orders', 'purchase', 'purchases', 'sale']);
    const productTable = this.findTable(tables, ['product', 'products', 'item', 'items']);
    const cartTable = this.findTable(tables, ['cart', 'shopping_cart', 'basket']);
    const reviewTable = this.findTable(tables, ['review', 'reviews', 'rating', 'comment']);
    const transactionTable = this.findTable(tables, ['transaction', 'transactions', 'payment']);

    // Generate basic example with main table
    if (userTable) {
      examples.push({
        title: `Generate ${userTable.name}`,
        description: 'Basic generation with realistic data',
        prompt: `Generate 100 ${userTable.name} with realistic data`,
        category: 'basic',
        relevance: 10,
      });
    }

    // User + Orders relationship
    if (userTable && orderTable) {
      const statusColumn = this.findColumn(orderTable, ['status', 'state', 'order_status']);
      
      examples.push({
        title: 'User-Order Relationship',
        description: 'Test order distribution across users',
        prompt: `Generate 50 ${userTable.name} and 200 ${orderTable.name} where:
- Each ${userTable.name.slice(0, -1)} has between 1-5 ${orderTable.name}
- ${statusColumn ? `70% have ${statusColumn} 'completed', 20% 'pending', 10% 'cancelled'` : 'Realistic status distribution'}
- Created in the last 3 months`,
        category: 'qa',
        relevance: 9,
      });

      examples.push({
        title: 'Abandoned Cart Scenario',
        description: 'Test cart recovery flow',
        prompt: `Generate data for abandoned cart testing:
- 20 ${userTable.name} with ${orderTable.name} in 'pending' status
- Orders created more than 24 hours ago
- Order amount > $100`,
        category: 'qa',
        relevance: 8,
      });
    }

    // Product + Reviews
    if (productTable && reviewTable) {
      examples.push({
        title: 'Product Reviews Distribution',
        description: 'Test review system',
        prompt: `Generate ${productTable.name} with ${reviewTable.name}:
- 50 ${productTable.name}
- 300 ${reviewTable.name} distributed across products
- 70% have rating 4-5 stars
- 20% have rating 3 stars
- 10% have rating 1-2 stars`,
        category: 'advanced',
        relevance: 7,
      });
    }

    // Status distribution (if any table has status column)
    const tableWithStatus = tables.find(t => 
      t.columns.some(c => c.name.toLowerCase().includes('status'))
    );
    if (tableWithStatus) {
      const statusCol = tableWithStatus.columns.find(c => c.name.toLowerCase().includes('status'));
      examples.push({
        title: 'Status Distribution Test',
        description: 'Test status-based filtering',
        prompt: `Generate 200 ${tableWithStatus.name} where:
- 80% have ${statusCol?.name || 'status'} 'active'
- 15% have ${statusCol?.name || 'status'} 'pending'
- 5% have ${statusCol?.name || 'status'} 'inactive'`,
        category: 'qa',
        relevance: 8,
      });
    }

    // Edge cases with numeric columns
    const tableWithPrice = tables.find(t =>
      t.columns.some(c => ['price', 'amount', 'cost', 'total'].includes(c.name.toLowerCase()))
    );
    if (tableWithPrice) {
      const priceCol = tableWithPrice.columns.find(c => 
        ['price', 'amount', 'cost', 'total'].includes(c.name.toLowerCase())
      );
      examples.push({
        title: 'Price Edge Cases',
        description: 'Test boundary conditions',
        prompt: `Generate edge case ${tableWithPrice.name}:
- 10 with ${priceCol?.name || 'price'} = $0.01 (minimum)
- 20 with ${priceCol?.name || 'price'} between $10-$100
- 10 with ${priceCol?.name || 'price'} > $1,000 (premium)`,
        category: 'qa',
        relevance: 7,
      });
    }

    // Date range testing
    const tableWithDate = tables.find(t =>
      t.columns.some(c => c.name.toLowerCase().includes('created') || c.name.toLowerCase().includes('date'))
    );
    if (tableWithDate) {
      examples.push({
        title: 'Time-based Distribution',
        description: 'Test date filters and reports',
        prompt: `Generate 500 ${tableWithDate.name} where:
- 100 created in the last 7 days
- 200 created in the last 30 days
- 200 created in the last 6 months`,
        category: 'advanced',
        relevance: 6,
      });
    }

    // New vs returning users
    if (userTable && orderTable) {
      examples.push({
        title: 'User Segmentation',
        description: 'Test retention metrics',
        prompt: `Generate ${userTable.name} for retention analysis:
- 30 ${userTable.name} with no ${orderTable.name} (never purchased)
- 50 ${userTable.name} with 1 ${orderTable.name.slice(0, -1)} (first-time)
- 20 ${userTable.name} with 5+ ${orderTable.name} (loyal customers)`,
        category: 'advanced',
        relevance: 7,
      });
    }

    // Sort by relevance
    return examples.sort((a, b) => b.relevance - a.relevance);
  }

  private static findTable(tables: TableInfo[], names: string[]): TableInfo | undefined {
    return tables.find(t => 
      names.some(name => t.name.toLowerCase().includes(name))
    );
  }

  private static findColumn(table: TableInfo, names: string[]): string | undefined {
    const column = table.columns.find(c =>
      names.some(name => c.name.toLowerCase().includes(name))
    );
    return column?.name;
  }
}
