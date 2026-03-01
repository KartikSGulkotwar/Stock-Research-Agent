import axios from 'axios';
import { config } from '../config';
import { StockPrice, CompanyFundamentals, NewsArticle, AnalystRatings } from '../types';

export class StockDataFetcher {
  private yahooHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };

  async getPriceData(symbol: string, period: string = '1y'): Promise<StockPrice[]> {
    console.log(`  📊 Fetching prices for ${symbol}...`);

    const endDate = Math.floor(Date.now() / 1000);
    let startDate: number;
    if (period === '6mo') {
      startDate = endDate - 6 * 30 * 24 * 60 * 60;
    } else {
      startDate = endDate - 365 * 24 * 60 * 60;
    }

    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
      const response = await axios.get(url, {
        params: {
          period1: startDate,
          period2: endDate,
          interval: '1d',
          includeAdjustedClose: true,
        },
        headers: this.yahooHeaders,
      });

      const result = response.data.chart.result[0];
      const timestamps = result.timestamp || [];
      const quotes = result.indicators.quote[0];
      const adjClose = result.indicators.adjclose?.[0]?.adjclose;

      const prices: StockPrice[] = [];
      for (let i = 0; i < timestamps.length; i++) {
        if (quotes.close[i] == null) continue;
        prices.push({
          symbol,
          timestamp: new Date(timestamps[i] * 1000).toISOString(),
          open: quotes.open[i] ?? 0,
          high: quotes.high[i] ?? 0,
          low: quotes.low[i] ?? 0,
          close: quotes.close[i] ?? 0,
          volume: quotes.volume[i] ?? 0,
          adjusted_close: adjClose?.[i] ?? quotes.close[i] ?? 0,
        });
      }

      console.log(`  ✅ Got ${prices.length} price records`);
      return prices;
    } catch (error: any) {
      console.warn(`  ⚠️  Price fetch failed: ${error.message}`);
      return [];
    }
  }

  async getCompanyInfo(symbol: string): Promise<CompanyFundamentals> {
    console.log(`  💰 Fetching fundamentals for ${symbol}...`);

    // Primary: Financial Modeling Prep API (stable endpoints)
    if (config.apis.fmpApi) {
      try {
        const [profileRes, ratiosRes, metricsRes] = await Promise.all([
          axios.get(`https://financialmodelingprep.com/stable/profile`, {
            params: { symbol, apikey: config.apis.fmpApi },
          }),
          axios.get(`https://financialmodelingprep.com/stable/ratios`, {
            params: { symbol, period: 'annual', apikey: config.apis.fmpApi },
          }),
          axios.get(`https://financialmodelingprep.com/stable/key-metrics`, {
            params: { symbol, period: 'annual', apikey: config.apis.fmpApi },
          }),
        ]);

        const profile = profileRes.data?.[0];
        const ratios = ratiosRes.data?.[0];
        const metrics = metricsRes.data?.[0];

        if (profile || ratios) {
          const result = {
            symbol,
            timestamp: new Date().toISOString(),
            pe_ratio: ratios?.priceToEarningsRatio ?? 0,
            market_cap: profile?.marketCap ?? metrics?.marketCap ?? 0,
            revenue: 0, // calculated from margin if needed
            profit_margin: ratios?.netProfitMargin ?? 0,
            debt_to_equity: ratios?.debtToEquityRatio ?? 0,
            eps: ratios?.netIncomePerShare ?? 0,
            beta: profile?.beta ?? 1.0,
          };

          console.log(`  ✅ Got fundamentals from FMP (P/E: ${result.pe_ratio.toFixed(1)}, MCap: $${(result.market_cap / 1e9).toFixed(1)}B, EPS: $${result.eps.toFixed(2)})`);
          return result;
        }
      } catch (error: any) {
        console.warn(`  ⚠️  FMP API error: ${error.message}`);
      }
    }

    // Fallback: return zeros if no API available
    console.warn(`  ⚠️  No fundamental data source available`);
    return {
      symbol,
      timestamp: new Date().toISOString(),
      pe_ratio: 0,
      market_cap: 0,
      revenue: 0,
      profit_margin: 0,
      debt_to_equity: 0,
      eps: 0,
      beta: 1.0,
    };
  }

  async getNews(symbol: string, days: number = 7): Promise<NewsArticle[]> {
    console.log(`  📰 Fetching news for ${symbol}...`);
    if (!config.apis.newsApi) {
      console.warn('  ⚠️  NewsAPI not configured — skipping news');
      return [];
    }

    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: symbol,
          from: fromDate.toISOString().split('T')[0],
          sortBy: 'publishedAt',
          apiKey: config.apis.newsApi,
          language: 'en',
          pageSize: 50,
        },
      });

      const articles = response.data.articles || [];
      console.log(`  ✅ Got ${articles.length} news articles (pre-filter)`);

      // Filter: English-only (reject titles with non-Latin characters), remove [Removed], deduplicate
      const seen = new Set<string>();
      const filtered = articles.filter((article: any) => {
        const title = article.title || '';
        // Skip removed/empty articles
        if (!title || title === '[Removed]') return false;
        // Skip non-English: reject if >20% non-ASCII characters (catches Japanese, Chinese, Korean, Arabic, etc.)
        const nonAscii = title.replace(/[\x00-\x7F]/g, '').length;
        if (nonAscii / title.length > 0.2) return false;
        // Deduplicate by headline
        const key = title.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      console.log(`  ✅ ${filtered.length} articles after filtering`);
      return filtered.map((article: any) => ({
        symbol,
        timestamp: article.publishedAt,
        headline: article.title,
        source: article.source.name,
        url: article.url,
        content: article.description || '',
        sentiment: 'neutral' as const,
        sentiment_score: 0.5,
      }));
    } catch (error: any) {
      console.warn('  ⚠️  News fetch failed:', error.message);
      return [];
    }
  }

  async getCompanyProfile(symbol: string): Promise<any> {
    console.log(`  🏢 Fetching company profile for ${symbol}...`);
    if (!config.apis.fmpApi) return null;

    try {
      const res = await axios.get(`https://financialmodelingprep.com/stable/profile`, {
        params: { symbol, apikey: config.apis.fmpApi },
      });
      const profile = res.data?.[0];
      if (!profile) return null;

      return {
        symbol,
        companyName: profile.companyName || symbol,
        sector: profile.sector || 'Unknown',
        industry: profile.industry || 'Unknown',
        exchange: profile.exchangeShortName || '',
        description: profile.description || '',
        ceo: profile.ceo || '',
        country: profile.country || '',
        employees: profile.fullTimeEmployees || 0,
        website: profile.website || '',
        image: profile.image || '',
      };
    } catch (error: any) {
      console.warn(`  ⚠️  Profile fetch failed: ${error.message}`);
      return null;
    }
  }

  async getSectorPeers(symbol: string): Promise<any[]> {
    console.log(`  🔗 Fetching sector peers for ${symbol}...`);
    if (!config.apis.fmpApi) return [];

    try {
      const peersRes = await axios.get(`https://financialmodelingprep.com/stable/stock-peers`, {
        params: { symbol, apikey: config.apis.fmpApi },
      });
      const peers = peersRes.data?.[0]?.peersList || [];
      if (peers.length === 0) return [];

      const topPeers = peers.slice(0, 4);
      const profiles = await Promise.all(topPeers.map(async (peer: string) => {
        try {
          const res = await axios.get(`https://financialmodelingprep.com/stable/profile`, {
            params: { symbol: peer, apikey: config.apis.fmpApi },
          });
          const p = res.data?.[0];
          if (!p) return null;
          return {
            symbol: peer,
            companyName: p.companyName || peer,
            price: p.price || 0,
            marketCap: p.marketCap || 0,
            beta: p.beta || 1.0,
            changes: p.changes || 0,
            changesPercentage: p.changesPercentage || 0,
          };
        } catch { return null; }
      }));

      return profiles.filter(Boolean);
    } catch (error: any) {
      console.warn(`  ⚠️  Peers fetch failed: ${error.message}`);
      return [];
    }
  }

  async getAnalystRatings(symbol: string): Promise<AnalystRatings | null> {
    console.log(`  🏦 Fetching analyst ratings for ${symbol}...`);
    if (!config.apis.fmpApi) {
      console.warn('  ⚠️  FMP API not configured — skipping analyst ratings');
      return null;
    }

    try {
      const [consensusRes, targetRes] = await Promise.all([
        axios.get(`https://financialmodelingprep.com/stable/grades-consensus`, {
          params: { symbol, apikey: config.apis.fmpApi },
        }),
        axios.get(`https://financialmodelingprep.com/stable/price-target-consensus`, {
          params: { symbol, apikey: config.apis.fmpApi },
        }),
      ]);

      const grades = consensusRes.data?.[0];
      const targets = targetRes.data?.[0];

      if (!grades && !targets) return null;

      const result: AnalystRatings = {
        symbol,
        strongBuy: grades?.strongBuy ?? 0,
        buy: grades?.buy ?? 0,
        hold: grades?.hold ?? 0,
        sell: grades?.sell ?? 0,
        strongSell: grades?.strongSell ?? 0,
        consensus: grades?.consensus ?? 'N/A',
        targetHigh: targets?.targetHigh ?? 0,
        targetLow: targets?.targetLow ?? 0,
        targetConsensus: targets?.targetConsensus ?? 0,
        targetMedian: targets?.targetMedian ?? 0,
      };

      const total = result.strongBuy + result.buy + result.hold + result.sell + result.strongSell;
      const buyPct = total > 0 ? (((result.strongBuy + result.buy) / total) * 100).toFixed(1) : '0';
      console.log(`  ✅ Got analyst ratings: ${buyPct}% Buy from ${total} analysts, consensus target $${result.targetConsensus}`);
      return result;
    } catch (error: any) {
      console.warn(`  ⚠️  Analyst ratings fetch failed: ${error.message}`);
      return null;
    }
  }
}
