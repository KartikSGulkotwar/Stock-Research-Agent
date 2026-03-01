export interface StockPrice {
  symbol: string;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjusted_close: number;
}

export interface TechnicalIndicators {
  symbol: string;
  timestamp: string;
  rsi?: number;
  macd?: number;
  macd_signal?: number;
  ma_50?: number;
  ma_200?: number;
  bollinger_upper?: number;
  bollinger_lower?: number;
}

export interface CompanyFundamentals {
  symbol: string;
  timestamp: string;
  pe_ratio: number;
  market_cap: number;
  revenue: number;
  profit_margin: number;
  debt_to_equity: number;
  eps: number;
  beta: number;
}

export interface NewsArticle {
  symbol: string;
  timestamp: string;
  headline: string;
  source: string;
  url: string;
  content: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentiment_score: number;
}

export interface TechnicalAnalysis {
  trend: 'bullish' | 'bearish' | 'neutral';
  support_level?: number;
  resistance_level?: number;
  momentum: 'strong' | 'moderate' | 'weak';
  score: number;
  signals: string[];
  summary: string;
}

export interface FundamentalAnalysis {
  score: number;
  valuation: 'overvalued' | 'fair' | 'undervalued';
  growth_rating: 'high' | 'medium' | 'low';
  financial_health: 'strong' | 'moderate' | 'weak';
  summary: string;
  key_metrics: {
    pe_ratio: number;
    market_cap: number;
    profit_margin: number;
  };
}

export interface SentimentAnalysis {
  score: number;
  overall_sentiment: 'positive' | 'negative' | 'neutral';
  news_count: number;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  key_topics: string[];
  summary: string;
}

export interface RiskAssessment {
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  volatility: number;
  key_risks: string[];
  risk_score: number;
  summary: string;
}

export interface AnalysisResult {
  symbol: string;
  timestamp: string;
  recommendation: 'BUY' | 'HOLD' | 'SELL';
  analysis_direction: 'bullish' | 'bearish' | 'neutral';
  signal_strength: 'strong' | 'moderate' | 'weak';
  confidence: number;
  technical_score: number;
  fundamental_score: number;
  sentiment_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  price_at_analysis: number;
  target_price?: number;
  stop_loss?: number;
  summary: string;
  key_findings?: string[];
  risk_considerations?: string[];
  analyst_ratings?: AnalystRatings;
  detailed_analysis: {
    technical: TechnicalAnalysis;
    fundamental: FundamentalAnalysis;
    sentiment: SentimentAnalysis;
    risk: RiskAssessment;
  };
}

export interface AnalystRatings {
  symbol: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  consensus: string;
  targetHigh: number;
  targetLow: number;
  targetConsensus: number;
  targetMedian: number;
}

export interface DataCollectionResult {
  pricesCount: number;
  indicatorsCount: number;
  newsCount: number;
  fundamentalsCollected: boolean;
}
