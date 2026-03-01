import Anthropic from '@anthropic-ai/sdk';
import { ElasticsearchHelper } from '../utils/elasticsearch-helper';
import { DataCollectorAgent } from './data-collector';
import { TechnicalAnalyzerAgent } from './technical-analyzer';
import { FundamentalAnalyzerAgent } from './fundamental-analyzer';
import { SentimentAnalyzerAgent } from './sentiment-analyzer';
import { RiskAssessorAgent } from './risk-assessor';
import { config } from '../config';
import { AnalysisResult, AnalystRatings } from '../types';

export class CoordinatorAgent {
  private esHelper = new ElasticsearchHelper();
  private claude = new Anthropic({ apiKey: config.apis.anthropic });
  private dataCollector = new DataCollectorAgent();
  private technicalAnalyzer = new TechnicalAnalyzerAgent();
  private fundamentalAnalyzer = new FundamentalAnalyzerAgent();
  private sentimentAnalyzer = new SentimentAnalyzerAgent();
  private riskAssessor = new RiskAssessorAgent();

  async analyzeStock(symbol: string): Promise<AnalysisResult> {
    console.log('\n' + '='.repeat(60));
    console.log(`COORDINATOR: ${symbol}`);
    console.log('='.repeat(60));

    await this.dataCollector.collectAllData(symbol);
    const analystRatings = this.dataCollector.analystRatings;

    const [technical, fundamental, sentiment, risk] = await Promise.all([
      this.technicalAnalyzer.analyze(symbol),
      this.fundamentalAnalyzer.analyze(symbol),
      this.sentimentAnalyzer.analyze(symbol),
      this.riskAssessor.assess(symbol),
    ]);

    const latestPrice = await this.esHelper.getLatestDocument(config.indexes.stockPrices, symbol);
    const currentPrice = latestPrice?.close || 0;

    const finalRec = await this.synthesize(symbol, currentPrice, technical, fundamental, sentiment, risk, analystRatings);
    await this.esHelper.indexDocument(config.indexes.analysisHistory, finalRec);
    this.display(finalRec);

    return finalRec;
  }

  private async synthesize(symbol: string, price: number, tech: any, fund: any, sent: any, risk: any, analysts: AnalystRatings | null): Promise<AnalysisResult> {
    console.log('\nSynthesizing...');

    const avgScore = Math.round((tech.score + fund.score + sent.score) / 3);

    let analystSection = '';
    if (analysts) {
      const total = analysts.strongBuy + analysts.buy + analysts.hold + analysts.sell + analysts.strongSell;
      const buyPct = total > 0 ? (((analysts.strongBuy + analysts.buy) / total) * 100).toFixed(1) : '0';
      const holdPct = total > 0 ? ((analysts.hold / total) * 100).toFixed(1) : '0';
      const sellPct = total > 0 ? (((analysts.sell + analysts.strongSell) / total) * 100).toFixed(1) : '0';
      analystSection = `
WALL STREET ANALYST RATINGS (${total} analysts):
- Buy: ${buyPct}% (${analysts.strongBuy} Strong Buy + ${analysts.buy} Buy)
- Hold: ${holdPct}% (${analysts.hold})
- Sell: ${sellPct}% (${analysts.sell} Sell + ${analysts.strongSell} Strong Sell)
- Consensus: ${analysts.consensus}
- Price Target: $${analysts.targetConsensus} (Low: $${analysts.targetLow}, High: $${analysts.targetHigh})

Wall Street analyst consensus is a key data point. Weight it heavily in your analysis direction.
If analyst consensus is "Buy" with >70% buy ratings, this data strongly supports a bullish direction.
Use the analyst consensus price target to inform your estimated_fair_value.`;
    }

    const prompt = `You are an educational stock analysis tool. Synthesize this ${symbol} analysis and describe what the data indicates.

IMPORTANT: You are NOT providing investment advice. You are describing what multiple data sources and indicators suggest. Use descriptive language like "data indicates", "analysis suggests", "factors point toward", "indicators show". NEVER say "you should buy/sell" or "we recommend".

PRICE: $${price.toFixed(2)}
Technical (${tech.score}/100): ${tech.summary}
Fundamental (${fund.score}/100): ${fund.summary}
Sentiment (${sent.score}/100): ${sent.summary}
Risk (${risk.risk_level}): ${risk.summary}
${analystSection}

Average score: ${avgScore}/100

ANALYSIS DIRECTION RULES:
- Average score >= 65 → direction is "bullish"
- Average score <= 35 → direction is "bearish"
- Average score 36-64 → use your judgment:
  - If 2 out of 3 scores are above 60 → lean bullish
  - If 2 out of 3 scores are below 40 → lean bearish
  - If Wall Street analyst consensus is "Buy" with >60% buy ratings → lean bullish
  - Only mark as "neutral" if signals genuinely conflict

Return ONLY JSON:
{
  "analysis_direction": "bullish" or "bearish" or "neutral",
  "signal_strength": "strong" or "moderate" or "weak",
  "confidence": number (0-1),
  "estimated_fair_value": number (based on analyst targets and fundamentals),
  "technical_support": number (key support level from technical analysis),
  "key_findings": ["finding 1", "finding 2", "finding 3", "finding 4"],
  "risk_considerations": ["risk 1", "risk 2"],
  "summary": "Educational summary using descriptive language about what the data indicates. Never use imperative language like 'buy this stock'. Instead say things like 'Multiple indicators suggest bullish momentum' or 'Data points toward positive outlook'."
}`;

    const message = await this.claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const rec = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      analysis_direction: 'neutral',
      signal_strength: 'weak',
      confidence: 0.5,
      estimated_fair_value: price * 1.1,
      technical_support: price * 0.9,
      key_findings: ['Analysis complete'],
      risk_considerations: ['All investments carry risk'],
      summary: 'Analysis complete. Please consult a financial advisor.',
    };

    // Map direction to legacy recommendation field for backward compatibility
    const directionToRec: Record<string, 'BUY' | 'HOLD' | 'SELL'> = {
      bullish: 'BUY',
      bearish: 'SELL',
      neutral: 'HOLD',
    };

    return {
      symbol,
      timestamp: new Date().toISOString(),
      recommendation: directionToRec[rec.analysis_direction] || 'HOLD',
      analysis_direction: rec.analysis_direction,
      signal_strength: rec.signal_strength,
      confidence: rec.confidence,
      technical_score: tech.score,
      fundamental_score: fund.score,
      sentiment_score: sent.score,
      risk_level: risk.risk_level,
      price_at_analysis: price,
      target_price: rec.estimated_fair_value,
      stop_loss: rec.technical_support,
      summary: rec.summary,
      key_findings: rec.key_findings,
      risk_considerations: rec.risk_considerations,
      analyst_ratings: analysts ?? undefined,
      detailed_analysis: { technical: tech, fundamental: fund, sentiment: sent, risk },
    };
  }

  private display(result: AnalysisResult): void {
    console.log('\n' + '='.repeat(60));
    console.log(`${result.symbol} - $${result.price_at_analysis.toFixed(2)}`);
    console.log(`Direction: ${result.analysis_direction} (${result.signal_strength}) | Confidence: ${(result.confidence * 100).toFixed(0)}%`);
    console.log(`Scores: Tech ${result.technical_score}, Fund ${result.fundamental_score}, Sent ${result.sentiment_score}`);
    console.log(`Risk: ${result.risk_level}`);
    if (result.analyst_ratings) {
      const a = result.analyst_ratings;
      const total = a.strongBuy + a.buy + a.hold + a.sell + a.strongSell;
      const buyPct = total > 0 ? (((a.strongBuy + a.buy) / total) * 100).toFixed(1) : '0';
      console.log(`Analysts: ${buyPct}% Buy (${total} analysts), Target: $${a.targetConsensus}`);
    }
    if (result.key_findings) {
      console.log('\nKey Findings:');
      result.key_findings.forEach(f => console.log(`  - ${f}`));
    }
    console.log(`\n${result.summary}`);
    console.log('='.repeat(60));
    console.log('DISCLAIMER: For educational purposes only. Not investment advice.');
  }
}
