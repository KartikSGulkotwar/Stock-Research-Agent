import { StockDataFetcher } from '../utils/data-fetcher';
import { ElasticsearchHelper } from '../utils/elasticsearch-helper';
import { TechnicalIndicatorsCalculator } from '../utils/technical-indicators';
import { config } from '../config';
import { DataCollectionResult, AnalystRatings } from '../types';

export class DataCollectorAgent {
  private fetcher = new StockDataFetcher();
  private esHelper = new ElasticsearchHelper();
  private techCalc = new TechnicalIndicatorsCalculator();
  private _analystRatings: AnalystRatings | null = null;

  get analystRatings(): AnalystRatings | null {
    return this._analystRatings;
  }

  async collectAllData(symbol: string): Promise<DataCollectionResult> {
    console.log('\nData Collector Agent: ' + symbol);
    console.log('----------------------------------------');

    const prices = await this.fetcher.getPriceData(symbol, '1y');
    if (prices.length > 0) await this.esHelper.bulkIndex(config.indexes.stockPrices, prices);

    const indicators = this.techCalc.calculateIndicators(prices);
    if (indicators.length > 0) await this.esHelper.bulkIndex(config.indexes.technicalIndicators, indicators);

    const fundamentals = await this.fetcher.getCompanyInfo(symbol);
    await this.esHelper.indexDocument(config.indexes.companyFundamentals, fundamentals);

    const news = await this.fetcher.getNews(symbol, 30);
    if (news.length > 0) await this.esHelper.bulkIndex(config.indexes.newsArticles, news);

    this._analystRatings = await this.fetcher.getAnalystRatings(symbol);

    console.log('━'.repeat(60));
    console.log(`✅ Data collection complete!`);

    return {
      pricesCount: prices.length,
      indicatorsCount: indicators.length,
      newsCount: news.length,
      fundamentalsCollected: true,
    };
  }
}
