import Anthropic from '@anthropic-ai/sdk';
import { ElasticsearchHelper } from '../utils/elasticsearch-helper';
import { config } from '../config';
import { SentimentAnalysis } from '../types';

export class SentimentAnalyzerAgent {
  private esHelper = new ElasticsearchHelper();
  private claude = new Anthropic({ apiKey: config.apis.anthropic });

  async analyze(symbol: string): Promise<SentimentAnalysis> {
    console.log(`\n📰 Sentiment Analyzer Agent: ${symbol}`);
    console.log('━'.repeat(60));

    const news = await this.esHelper.getRecentDocuments(config.indexes.newsArticles, symbol, 30);
    if (news.length === 0) {
      console.log('No news');
      return { score: 50, overall_sentiment: 'neutral', news_count: 0, positive_count: 0, negative_count: 0, neutral_count: 0, key_topics: [], summary: 'No news data' };
    }

    const headlines = news.slice(0, 20).map(n => n.headline);
    const lines = headlines.map((h, i) => (i + 1) + '. ' + h).join('\n');
    const prompt = 'Analyze sentiment for ' + symbol + ':\n\nHEADLINES:\n' + lines + '\n\nReturn ONLY JSON:\n{"score": number (0-100), "overall_sentiment": "positive" or "negative" or "neutral", "news_count": ' + news.length + ', "positive_count": number, "negative_count": number, "neutral_count": number, "key_topics": ["topic1"], "summary": "brief summary"}';

    const message = await this.claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const analysis: SentimentAnalysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      score: 50,
      overall_sentiment: 'neutral',
      news_count: news.length,
      positive_count: 0,
      negative_count: 0,
      neutral_count: 0,
      key_topics: [],
      summary: 'Analysis unavailable',
    };

    console.log(`  ✅ Score: ${analysis.score}/100, Sentiment: ${analysis.overall_sentiment}`);
    return analysis;
  }
}
