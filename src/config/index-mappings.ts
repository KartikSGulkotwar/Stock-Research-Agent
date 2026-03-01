export const STOCK_PRICES_MAPPING = {
  mappings: {
    properties: {
      symbol: { type: 'keyword' },
      timestamp: { type: 'date' },
      open: { type: 'float' },
      high: { type: 'float' },
      low: { type: 'float' },
      close: { type: 'float' },
      volume: { type: 'long' },
      adjusted_close: { type: 'float' },
    },
  },
};

export const NEWS_ARTICLES_MAPPING = {
  mappings: {
    properties: {
      symbol: { type: 'keyword' },
      timestamp: { type: 'date' },
      headline: { type: 'text' },
      source: { type: 'keyword' },
      url: { type: 'keyword' },
      sentiment: { type: 'keyword' },
      sentiment_score: { type: 'float' },
      content: { type: 'text' },
    },
  },
};

export const FUNDAMENTALS_MAPPING = {
  mappings: {
    properties: {
      symbol: { type: 'keyword' },
      timestamp: { type: 'date' },
      pe_ratio: { type: 'float' },
      market_cap: { type: 'long' },
      revenue: { type: 'long' },
      profit_margin: { type: 'float' },
      debt_to_equity: { type: 'float' },
      eps: { type: 'float' },
      beta: { type: 'float' },
    },
  },
};

export const TECHNICAL_INDICATORS_MAPPING = {
  mappings: {
    properties: {
      symbol: { type: 'keyword' },
      timestamp: { type: 'date' },
      rsi: { type: 'float' },
      macd: { type: 'float' },
      macd_signal: { type: 'float' },
      ma_50: { type: 'float' },
      ma_200: { type: 'float' },
      bollinger_upper: { type: 'float' },
      bollinger_lower: { type: 'float' },
    },
  },
};

export const ANALYSIS_HISTORY_MAPPING = {
  mappings: {
    properties: {
      symbol: { type: 'keyword' },
      timestamp: { type: 'date' },
      recommendation: { type: 'keyword' },
      confidence: { type: 'float' },
      technical_score: { type: 'integer' },
      fundamental_score: { type: 'integer' },
      sentiment_score: { type: 'integer' },
      risk_level: { type: 'keyword' },
      price_at_analysis: { type: 'float' },
      target_price: { type: 'float' },
      stop_loss: { type: 'float' },
      summary: { type: 'text' },
    },
  },
};
