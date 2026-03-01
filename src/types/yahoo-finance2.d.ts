declare module 'yahoo-finance2' {
  interface HistoricalQuote {
    date: Date;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
    adjClose?: number;
  }

  interface QuoteSummary {
    price?: { marketCap?: number };
    summaryDetail?: { trailingPE?: number };
    defaultKeyStatistics?: { trailingEps?: number; beta?: number };
    financialData?: {
      totalRevenue?: number;
      profitMargins?: number;
      debtToEquity?: number;
    };
  }

  const yahooFinance: {
    historical: (
      symbol: string,
      options: { period1: Date; period2: Date; interval: string }
    ) => Promise<HistoricalQuote[]>;
    quoteSummary: (
      symbol: string,
      options: { modules: string[] }
    ) => Promise<QuoteSummary>;
  };

  export default yahooFinance;
}
