import { SMA, RSI, MACD, BollingerBands } from 'technicalindicators';
import { StockPrice, TechnicalIndicators } from '../types';

export class TechnicalIndicatorsCalculator {
  calculateIndicators(priceData: StockPrice[]): TechnicalIndicators[] {
    if (priceData.length === 0) return [];

    console.log(`  📈 Calculating indicators...`);
    const sorted = [...priceData].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const closes = sorted.map(d => d.close);

    const rsiValues = RSI.calculate({ values: closes, period: 14 });
    const macdValues = MACD.calculate({ values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false });
    const sma50 = SMA.calculate({ period: 50, values: closes });
    const sma200 = SMA.calculate({ period: 200, values: closes });
    const bbValues = BollingerBands.calculate({ period: 20, values: closes, stdDev: 2 });

    return sorted.map((price, i) => {
      const rsiIdx = i - (closes.length - rsiValues.length);
      const macdIdx = i - (closes.length - macdValues.length);
      const sma50Idx = i - (closes.length - sma50.length);
      const sma200Idx = i - (closes.length - sma200.length);
      const bbIdx = i - (closes.length - bbValues.length);

      return {
        symbol: price.symbol,
        timestamp: price.timestamp,
        rsi: rsiIdx >= 0 ? rsiValues[rsiIdx] : undefined,
        macd: macdIdx >= 0 ? macdValues[macdIdx]?.MACD : undefined,
        macd_signal: macdIdx >= 0 ? macdValues[macdIdx]?.signal : undefined,
        ma_50: sma50Idx >= 0 ? sma50[sma50Idx] : undefined,
        ma_200: sma200Idx >= 0 ? sma200[sma200Idx] : undefined,
        bollinger_upper: bbIdx >= 0 ? bbValues[bbIdx]?.upper : undefined,
        bollinger_lower: bbIdx >= 0 ? bbValues[bbIdx]?.lower : undefined,
      };
    });
  }
}
