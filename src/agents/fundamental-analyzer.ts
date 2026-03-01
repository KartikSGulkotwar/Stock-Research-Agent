import Anthropic from '@anthropic-ai/sdk';
import { ElasticsearchHelper } from '../utils/elasticsearch-helper';
import { config } from '../config';
import { FundamentalAnalysis } from '../types';

export class FundamentalAnalyzerAgent {
  private esHelper = new ElasticsearchHelper();
  private claude = new Anthropic({ apiKey: config.apis.anthropic });

  async analyze(symbol: string): Promise<FundamentalAnalysis> {
    console.log(`\n💰 Fundamental Analyzer Agent: ${symbol}`);
    console.log('━'.repeat(60));

    const fund = await this.esHelper.getLatestDocument(config.indexes.companyFundamentals, symbol);

    const hasData = fund && (fund.pe_ratio > 0 || fund.market_cap > 0 || fund.eps > 0);

    const prompt = `Analyze ${symbol} fundamentals:

PE Ratio: ${hasData && fund.pe_ratio > 0 ? fund.pe_ratio.toFixed(2) : 'N/A'}
Market Cap: ${hasData && fund.market_cap > 0 ? '$' + (fund.market_cap / 1e9).toFixed(2) + 'B' : 'N/A'}
EPS: ${hasData && fund.eps ? '$' + fund.eps.toFixed(2) : 'N/A'}
Profit Margin: ${hasData && fund.profit_margin ? (fund.profit_margin * 100).toFixed(2) + '%' : 'N/A'}
Debt/Equity: ${hasData && fund.debt_to_equity ? fund.debt_to_equity.toFixed(2) : 'N/A'}
Beta: ${hasData && fund.beta ? fund.beta.toFixed(2) : 'N/A'}

${!hasData ? 'IMPORTANT: Fundamental data is unavailable. Use your knowledge of ' + symbol + ' to provide your best estimate of a fundamental score and analysis.' : 'Analyze these metrics relative to industry peers and historical norms.'}

Return ONLY JSON:
{
  "score": number (0-100),
  "valuation": "overvalued" or "fair" or "undervalued",
  "growth_rating": "high" or "medium" or "low",
  "financial_health": "strong" or "moderate" or "weak",
  "summary": "brief summary",
  "key_metrics": {"pe_ratio": number, "market_cap": number, "profit_margin": number}
}`;

    const message = await this.claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const analysis: FundamentalAnalysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      score: 50,
      valuation: 'fair',
      growth_rating: 'medium',
      financial_health: 'moderate',
      summary: 'Analysis unavailable',
      key_metrics: { pe_ratio: fund?.pe_ratio ?? 0, market_cap: fund?.market_cap ?? 0, profit_margin: fund?.profit_margin ?? 0 },
    };

    console.log(`  ✅ Score: ${analysis.score}/100, Valuation: ${analysis.valuation}`);
    return analysis;
  }
}
