import Anthropic from '@anthropic-ai/sdk';
import { ElasticsearchHelper } from '../utils/elasticsearch-helper';
import { config } from '../config';
import { TechnicalAnalysis } from '../types';

export class TechnicalAnalyzerAgent {
  private esHelper = new ElasticsearchHelper();
  private claude = new Anthropic({ apiKey: config.apis.anthropic });

  async analyze(symbol: string): Promise<TechnicalAnalysis> {
    console.log(`\n📈 Technical Analyzer Agent: ${symbol}`);
    console.log('━'.repeat(60));

    const indicators = await this.esHelper.getLatestDocument(config.indexes.technicalIndicators, symbol);
    const prices = await this.esHelper.getRecentDocuments(config.indexes.stockPrices, symbol, 30);

    const currentPrice = prices[0]?.close ?? 0;
    const prompt = `You are a technical analyst. Analyze ${symbol}:

PRICE: $${currentPrice.toFixed(2)}
RSI: ${indicators?.rsi?.toFixed(2) ?? 'N/A'}
MACD: ${indicators?.macd?.toFixed(2) ?? 'N/A'}
MA50: $${indicators?.ma_50?.toFixed(2) ?? 'N/A'}
MA200: $${indicators?.ma_200?.toFixed(2) ?? 'N/A'}

Return ONLY valid JSON:
{
  "trend": "bullish" or "bearish" or "neutral",
  "support_level": number,
  "resistance_level": number,
  "momentum": "strong" or "moderate" or "weak",
  "score": number (0-100),
  "signals": ["signal1", "signal2"],
  "summary": "brief summary"
}`;

    const message = await this.claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const analysis: TechnicalAnalysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      trend: 'neutral',
      momentum: 'moderate',
      score: 50,
      signals: [],
      summary: 'Analysis unavailable',
    };

    console.log(`  ✅ Score: ${analysis.score}/100, Trend: ${analysis.trend}`);
    return analysis;
  }
}
