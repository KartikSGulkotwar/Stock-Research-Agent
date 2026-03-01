import { ElasticsearchHelper } from './utils/elasticsearch-helper';
import * as mappings from './config/index-mappings';
import { config } from './config';

async function setup() {
  console.log('🔧 Setting up Elasticsearch...\n');
  const es = new ElasticsearchHelper();

  if (!(await es.ping())) {
    console.error('❌ Cannot connect to Elasticsearch');
    process.exit(1);
  }

  console.log('✅ Connected\n');

  const indexes = {
    [config.indexes.stockPrices]: mappings.STOCK_PRICES_MAPPING,
    [config.indexes.newsArticles]: mappings.NEWS_ARTICLES_MAPPING,
    [config.indexes.companyFundamentals]: mappings.FUNDAMENTALS_MAPPING,
    [config.indexes.technicalIndicators]: mappings.TECHNICAL_INDICATORS_MAPPING,
    [config.indexes.analysisHistory]: mappings.ANALYSIS_HISTORY_MAPPING,
  };

  for (const [name, mapping] of Object.entries(indexes)) {
    await es.createIndex(name, mapping);
  }

  console.log('\n🎉 Setup complete!');
  console.log('\nNext: npm run dev TSLA\n');
}

setup().catch(console.error);
