import dotenv from 'dotenv';
dotenv.config();

export const config = {
  elasticsearch: {
    cloudId: process.env.ELASTICSEARCH_CLOUD_ID || '',
    username: process.env.ELASTICSEARCH_USERNAME || '',
    password: process.env.ELASTICSEARCH_PASSWORD || '',
  },
  apis: {
    anthropic: process.env.ANTHROPIC_API_KEY!,
    newsApi: process.env.NEWSAPI_KEY,
    fmpApi: process.env.FMP_API_KEY,
  },
  indexes: {
    stockPrices: 'stock_prices',
    technicalIndicators: 'technical_indicators',
    companyFundamentals: 'company_fundamentals',
    newsArticles: 'news_articles',
    analysisHistory: 'analysis_history',
  },
  server: {
    port: process.env.API_PORT || 3001,
  },
};

// Only Anthropic API key is strictly required
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('Missing: ANTHROPIC_API_KEY. Set it in your .env file.');
}

if (!config.elasticsearch.cloudId) {
  console.log('ℹ️  Elasticsearch not configured — using in-memory storage');
}

console.log('✅ Config loaded');
