import { config } from '../config';

// In-memory storage when Elasticsearch is not configured
class InMemoryStore {
  private store: Map<string, any[]> = new Map();

  async ping(): Promise<boolean> {
    return true;
  }

  async createIndex(indexName: string, _mappings: any): Promise<void> {
    if (!this.store.has(indexName)) {
      this.store.set(indexName, []);
      console.log(`  ✅ Created in-memory index: ${indexName}`);
    }
  }

  async indexDocument(indexName: string, document: any, _id?: string): Promise<void> {
    if (!this.store.has(indexName)) this.store.set(indexName, []);
    this.store.get(indexName)!.push(document);
  }

  async bulkIndex(indexName: string, documents: any[]): Promise<void> {
    if (documents.length === 0) return;
    if (!this.store.has(indexName)) this.store.set(indexName, []);
    this.store.get(indexName)!.push(...documents);
    console.log(`  ✅ Indexed ${documents.length} docs to ${indexName}`);
  }

  async search(indexName: string, query: any): Promise<any> {
    const docs = this.store.get(indexName) || [];
    let filtered = docs;

    // Handle term filter on symbol
    const termFilter = query.query?.term?.symbol || query.query?.bool?.must?.find((m: any) => m.term)?.term?.symbol;
    if (termFilter) {
      filtered = filtered.filter((d: any) => d.symbol === termFilter);
    }

    // Handle date range filter
    const rangeFilter = query.query?.bool?.must?.find((m: any) => m.range);
    if (rangeFilter?.range?.timestamp?.gte) {
      const gte = rangeFilter.range.timestamp.gte;
      const match = gte.match(/now-(\d+)d/);
      if (match) {
        const daysAgo = parseInt(match[1]);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysAgo);
        filtered = filtered.filter((d: any) => new Date(d.timestamp) >= cutoff);
      }
    }

    // Handle sort
    const sortField = query.sort?.[0];
    if (sortField) {
      const field = Object.keys(sortField)[0];
      const order = sortField[field].order;
      filtered = [...filtered].sort((a: any, b: any) => {
        const va = a[field], vb = b[field];
        if (order === 'desc') return va > vb ? -1 : va < vb ? 1 : 0;
        return va < vb ? -1 : va > vb ? 1 : 0;
      });
    }

    // Handle size
    const size = query.size || 1000;
    filtered = filtered.slice(0, size);

    return {
      hits: {
        hits: filtered.map((doc: any) => ({ _source: doc })),
      },
    };
  }

  async getLatestDocument(indexName: string, symbol: string): Promise<any> {
    const query = {
      query: { term: { symbol } },
      sort: [{ timestamp: { order: 'desc' } }],
      size: 1,
    };
    const result = await this.search(indexName, query);
    return result.hits.hits[0]?._source || null;
  }

  async getRecentDocuments(indexName: string, symbol: string, days: number = 30): Promise<any[]> {
    const query = {
      query: {
        bool: {
          must: [
            { term: { symbol } },
            { range: { timestamp: { gte: `now-${days}d` } } },
          ],
        },
      },
      sort: [{ timestamp: { order: 'desc' } }],
      size: 1000,
    };
    const result = await this.search(indexName, query);
    return result.hits.hits.map((hit: any) => hit._source);
  }
}

// Elasticsearch-backed storage
class ElasticsearchStore {
  private client: any;

  constructor() {
    const { Client } = require('@elastic/elasticsearch');
    this.client = new Client({
      cloud: { id: config.elasticsearch.cloudId },
      auth: { username: config.elasticsearch.username, password: config.elasticsearch.password },
    });
  }

  async ping(): Promise<boolean> {
    try {
      return await this.client.ping();
    } catch (error) {
      console.error('❌ ES ping failed:', error);
      return false;
    }
  }

  async createIndex(indexName: string, mappings: any): Promise<void> {
    try {
      const exists = await this.client.indices.exists({ index: indexName });
      if (!exists) {
        await this.client.indices.create({ index: indexName, body: mappings });
        console.log(`✅ Created index: ${indexName}`);
      } else {
        console.log(`ℹ️  Index exists: ${indexName}`);
      }
    } catch (error) {
      console.error(`❌ Error creating ${indexName}:`, error);
      throw error;
    }
  }

  async indexDocument(indexName: string, document: any, id?: string): Promise<void> {
    await this.client.index({ index: indexName, id, document });
  }

  async bulkIndex(indexName: string, documents: any[]): Promise<void> {
    if (documents.length === 0) return;
    const body = documents.flatMap((doc: any) => [{ index: { _index: indexName } }, doc]);
    const result = await this.client.bulk({ body, refresh: true });
    if (!result.errors) {
      console.log(`  ✅ Indexed ${documents.length} docs to ${indexName}`);
    }
  }

  async search(indexName: string, query: any): Promise<any> {
    return await this.client.search({ index: indexName, body: query });
  }

  async getLatestDocument(indexName: string, symbol: string): Promise<any> {
    const query = {
      query: { term: { symbol } },
      sort: [{ timestamp: { order: 'desc' } }],
      size: 1,
    };
    const result = await this.search(indexName, query);
    return result.hits.hits[0]?._source || null;
  }

  async getRecentDocuments(indexName: string, symbol: string, days: number = 30): Promise<any[]> {
    const query = {
      query: {
        bool: {
          must: [
            { term: { symbol } },
            { range: { timestamp: { gte: `now-${days}d` } } },
          ],
        },
      },
      sort: [{ timestamp: { order: 'desc' } }],
      size: 1000,
    };
    const result = await this.search(indexName, query);
    return result.hits.hits.map((hit: any) => hit._source);
  }
}

// Singleton in-memory store so all agents share the same data
let sharedInMemoryStore: InMemoryStore | null = null;
let loggedBackendChoice = false;

// Factory: use Elasticsearch if configured, otherwise in-memory
export class ElasticsearchHelper {
  private backend: InMemoryStore | ElasticsearchStore;

  constructor() {
    if (config.elasticsearch.cloudId && config.elasticsearch.username && config.elasticsearch.password) {
      if (!loggedBackendChoice) {
        console.log('📦 Using Elasticsearch backend');
        loggedBackendChoice = true;
      }
      this.backend = new ElasticsearchStore();
    } else {
      if (!loggedBackendChoice) {
        console.log('📦 Using in-memory backend');
        loggedBackendChoice = true;
      }
      if (!sharedInMemoryStore) sharedInMemoryStore = new InMemoryStore();
      this.backend = sharedInMemoryStore;
    }
  }

  ping() { return this.backend.ping(); }
  createIndex(indexName: string, mappings: any) { return this.backend.createIndex(indexName, mappings); }
  indexDocument(indexName: string, document: any, id?: string) { return this.backend.indexDocument(indexName, document, id); }
  bulkIndex(indexName: string, documents: any[]) { return this.backend.bulkIndex(indexName, documents); }
  search(indexName: string, query: any) { return this.backend.search(indexName, query); }
  getLatestDocument(indexName: string, symbol: string) { return this.backend.getLatestDocument(indexName, symbol); }
  getRecentDocuments(indexName: string, symbol: string, days?: number) { return this.backend.getRecentDocuments(indexName, symbol, days); }
}
