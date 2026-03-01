import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.API_PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Simple JSON endpoint — returns full result when done
app.get('/api/analyze/:symbol', async (req, res) => {
  const { symbol } = req.params;

  try {
    const { CoordinatorAgent } = await import('../../src/agents/coordinator');
    const coordinator = new CoordinatorAgent();
    const result = await coordinator.analyzeStock(symbol);
    res.json(result);
  } catch (error: any) {
    console.error('Analysis error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get analysis history for a symbol
app.get('/api/history/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const days = parseInt(req.query.days as string) || 90;

  try {
    const { ElasticsearchHelper } = await import('../../src/utils/elasticsearch-helper');
    const { config } = await import('../../src/config');
    const esHelper = new ElasticsearchHelper();
    const history = await esHelper.getRecentDocuments(config.indexes.analysisHistory, symbol.toUpperCase(), days);
    res.json(history);
  } catch (error: any) {
    console.error('History error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get all unique symbols that have been analyzed
app.get('/api/history', async (_req, res) => {
  try {
    const { ElasticsearchHelper } = await import('../../src/utils/elasticsearch-helper');
    const { config } = await import('../../src/config');
    const esHelper = new ElasticsearchHelper();
    const allHistory = await esHelper.search(config.indexes.analysisHistory, {
      query: { match_all: {} },
      sort: [{ timestamp: { order: 'desc' } }],
      size: 1000,
    });
    const docs = allHistory.hits.hits.map((h: any) => h._source);

    // Group by symbol, return latest per symbol
    const bySymbol: Record<string, any[]> = {};
    for (const doc of docs) {
      if (!bySymbol[doc.symbol]) bySymbol[doc.symbol] = [];
      bySymbol[doc.symbol].push(doc);
    }

    const summary = Object.entries(bySymbol).map(([sym, analyses]) => ({
      symbol: sym,
      total_analyses: analyses.length,
      latest: analyses[0],
      first_analyzed: analyses[analyses.length - 1]?.timestamp,
      last_analyzed: analyses[0]?.timestamp,
    }));

    res.json(summary);
  } catch (error: any) {
    console.error('History summary error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get current price for accuracy tracking
app.get('/api/price/:symbol', async (req, res) => {
  const { symbol } = req.params;
  try {
    const { StockDataFetcher } = await import('../../src/utils/data-fetcher');
    const fetcher = new StockDataFetcher();
    const prices = await fetcher.getPriceData(symbol.toUpperCase(), '6mo');
    if (prices.length > 0) {
      const latest = prices[prices.length - 1];
      res.json({ symbol: symbol.toUpperCase(), price: latest.close, timestamp: latest.timestamp });
    } else {
      res.status(404).json({ error: 'No price data' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get company profile (sector, industry, description)
app.get('/api/profile/:symbol', async (req, res) => {
  const { symbol } = req.params;
  try {
    const { StockDataFetcher } = await import('../../src/utils/data-fetcher');
    const fetcher = new StockDataFetcher();
    const profile = await fetcher.getCompanyProfile(symbol.toUpperCase());
    if (profile) {
      res.json(profile);
    } else {
      res.status(404).json({ error: 'Profile not found' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get sector peers
app.get('/api/peers/:symbol', async (req, res) => {
  const { symbol } = req.params;
  try {
    const { StockDataFetcher } = await import('../../src/utils/data-fetcher');
    const fetcher = new StockDataFetcher();
    const peers = await fetcher.getSectorPeers(symbol.toUpperCase());
    res.json(peers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent news articles for a symbol
app.get('/api/news/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const days = parseInt(req.query.days as string) || 30;

  try {
    const { ElasticsearchHelper } = await import('../../src/utils/elasticsearch-helper');
    const { config } = await import('../../src/config');
    const esHelper = new ElasticsearchHelper();
    const news = await esHelper.getRecentDocuments(config.indexes.newsArticles, symbol.toUpperCase(), days);
    res.json(news.slice(0, 20));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get chart data with OHLC + technical indicators
app.get('/api/chart/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const range = (req.query.range as string) || '6M';

  const periodMap: Record<string, string> = { '1M': '6mo', '3M': '6mo', '6M': '6mo', '1Y': '1y' };
  const period = periodMap[range] || '6mo';

  try {
    const { StockDataFetcher } = await import('../../src/utils/data-fetcher');
    const { TechnicalIndicatorsCalculator } = await import('../../src/utils/technical-indicators');
    const fetcher = new StockDataFetcher();
    const calculator = new TechnicalIndicatorsCalculator();

    const prices = await fetcher.getPriceData(symbol.toUpperCase(), period);
    const indicators = calculator.calculateIndicators(prices);

    // Merge prices with indicators
    const merged = prices.map((p, i) => {
      const ind = indicators[i] || {};
      return {
        timestamp: p.timestamp,
        open: p.open,
        high: p.high,
        low: p.low,
        close: p.close,
        volume: p.volume,
        ma_20: undefined as number | undefined,
        ma_50: ind.ma_50,
        ma_200: ind.ma_200,
        rsi: ind.rsi,
        bollinger_upper: ind.bollinger_upper,
        bollinger_lower: ind.bollinger_lower,
      };
    });

    // Calculate MA20 manually (not in the standard calculator)
    const closes = prices.map(p => p.close);
    for (let i = 19; i < closes.length; i++) {
      const slice = closes.slice(i - 19, i + 1);
      merged[i].ma_20 = slice.reduce((s, v) => s + v, 0) / 20;
    }

    // Filter by range
    const now = Date.now();
    const rangeMs: Record<string, number> = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };
    const daysBack = rangeMs[range] || 180;
    const cutoff = now - daysBack * 24 * 60 * 60 * 1000;
    const filtered = merged.filter(d => new Date(d.timestamp).getTime() >= cutoff);

    res.json(filtered);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Market overview: indices, sectors, top movers
app.get('/api/market/overview', async (_req, res) => {
  try {
    const { StockDataFetcher } = await import('../../src/utils/data-fetcher');
    const fetcher = new StockDataFetcher();

    // Fetch major indices
    const indexSymbols = [
      { symbol: '^GSPC', name: 'S&P 500' },
      { symbol: '^DJI', name: 'Dow Jones' },
      { symbol: '^IXIC', name: 'NASDAQ' },
      { symbol: '^RUT', name: 'Russell 2000' },
    ];

    const indices = await Promise.all(indexSymbols.map(async (idx) => {
      try {
        const prices = await fetcher.getPriceData(idx.symbol, '6mo');
        if (prices.length < 2) return null;
        const latest = prices[prices.length - 1];
        const prev = prices[prices.length - 2];
        return {
          symbol: idx.symbol,
          name: idx.name,
          price: latest.close,
          change: latest.close - prev.close,
          changePct: ((latest.close - prev.close) / prev.close) * 100,
        };
      } catch { return null; }
    }));

    // Fetch sector ETFs for sector performance
    const sectorETFs = [
      { symbol: 'XLK', sector: 'Technology' },
      { symbol: 'XLF', sector: 'Financials' },
      { symbol: 'XLV', sector: 'Healthcare' },
      { symbol: 'XLE', sector: 'Energy' },
      { symbol: 'XLY', sector: 'Consumer Disc.' },
      { symbol: 'XLP', sector: 'Consumer Staples' },
      { symbol: 'XLI', sector: 'Industrials' },
      { symbol: 'XLU', sector: 'Utilities' },
      { symbol: 'XLRE', sector: 'Real Estate' },
      { symbol: 'XLC', sector: 'Communication' },
    ];

    const sectors = await Promise.all(sectorETFs.map(async (s) => {
      try {
        const prices = await fetcher.getPriceData(s.symbol, '6mo');
        if (prices.length < 2) return null;
        const latest = prices[prices.length - 1];
        const prev = prices[prices.length - 2];
        return {
          sector: s.sector,
          changePct: ((latest.close - prev.close) / prev.close) * 100,
        };
      } catch { return null; }
    }));

    // Top movers from well-known large caps
    const moverSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'JPM', 'V', 'JNJ',
      'WMT', 'PG', 'UNH', 'HD', 'MA', 'DIS', 'NFLX', 'ADBE', 'CRM', 'PYPL'];

    const moverData = await Promise.all(moverSymbols.map(async (sym) => {
      try {
        const prices = await fetcher.getPriceData(sym, '6mo');
        if (prices.length < 2) return null;
        const latest = prices[prices.length - 1];
        const prev = prices[prices.length - 2];
        return {
          symbol: sym,
          name: sym,
          price: latest.close,
          changePct: ((latest.close - prev.close) / prev.close) * 100,
        };
      } catch { return null; }
    }));

    const validMovers = moverData.filter(Boolean) as TopMover[];
    const sorted = [...validMovers].sort((a, b) => b.changePct - a.changePct);

    interface TopMover { symbol: string; name: string; price: number; changePct: number; }

    res.json({
      indices: indices.filter(Boolean),
      sectors: (sectors.filter(Boolean) as { sector: string; changePct: number }[]).sort((a, b) => b.changePct - a.changePct),
      gainers: sorted.slice(0, 5),
      losers: sorted.slice(-5).reverse(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Stock screener: fetch data for multiple symbols
app.post('/api/screener', async (req, res) => {
  const { symbols } = req.body;
  if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
    return res.status(400).json({ error: 'Provide an array of symbols' });
  }

  try {
    const { StockDataFetcher } = await import('../../src/utils/data-fetcher');
    const fetcher = new StockDataFetcher();

    const results = await Promise.all(symbols.slice(0, 20).map(async (sym: string) => {
      try {
        const [prices, info, profile] = await Promise.all([
          fetcher.getPriceData(sym, '6mo'),
          fetcher.getCompanyInfo(sym),
          fetcher.getCompanyProfile(sym),
        ]);
        if (prices.length < 2) return null;
        const latest = prices[prices.length - 1];
        const prev = prices[prices.length - 2];
        return {
          symbol: sym,
          companyName: profile?.companyName || sym,
          price: latest.close,
          changePct: ((latest.close - prev.close) / prev.close) * 100,
          marketCap: info.market_cap || 0,
          pe: info.pe_ratio || 0,
          sector: profile?.sector || 'Unknown',
          beta: info.beta || 1.0,
        };
      } catch { return null; }
    }));

    res.json(results.filter(Boolean));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API on http://localhost:${PORT}`);
});
