import Anthropic from '@anthropic-ai/sdk';
import { ElasticsearchHelper } from '../utils/elasticsearch-helper';
import { config } from '../config';
import { RiskAssessment } from '../types';

export class RiskAssessorAgent {
  private esHelper = new ElasticsearchHelper();
  private claude = new Anthropic({ apiKey: config.apis.anthropic });

  async assess(symbol: string): Promise<RiskAssessment> {
    console.log(`\n⚠️  Risk Assessor Agent: ${symbol}`);
    console.log('━'.repeat(60));

    const prices = await this.esHelper.getRecentDocuments(config.indexes.stockPrices, symbol, 90);
    const fund = await this.esHelper.getLatestDocument(config.indexes.companyFundamentals, symbol);

    const volatility = this.calculateVolatility(prices);

    const prompt = `Assess risk for ${symbol}:

Volatility: ${(volatility * 100).toFixed(2)}%
Beta: ${fund?.beta?.toFixed(2)}

Return ONLY JSON:
{
  "risk_level": "LOW" or "MEDIUM" or "HIGH",
  "volatility": ${volatility},
  "key_risks": ["risk1", "risk2"],
  "risk_score": number (0-100),
  "summary": "brief summary"
}`;

    const message = await this.claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const analysis: RiskAssessment = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      risk_level: volatility < 0.15 ? 'LOW' : volatility > 0.3 ? 'HIGH' : 'MEDIUM',
      volatility,
      key_risks: ['Market volatility'],
      risk_score: 50,
      summary: 'Analysis unavailable',
    };

    console.log(`  ✅ Risk: ${analysis.risk_level}, Volatility: ${(volatility * 100).toFixed(2)}%`);
    return analysis;
  }

  private calculateVolatility(prices: any[]): number {
    if (prices.length < 2) return 0;
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i - 1].close - prices[i].close) / prices[i].close);
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance) * Math.sqrt(252);
  }
}
