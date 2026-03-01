declare module 'technicalindicators' {
  export const RSI: {
    calculate: (options: { values: number[]; period: number }) => number[];
  };
  export const SMA: {
    calculate: (options: { values: number[]; period: number }) => number[];
  };
  export const MACD: {
    calculate: (options: {
      values: number[];
      fastPeriod: number;
      slowPeriod: number;
      signalPeriod: number;
      SimpleMAOscillator: boolean;
      SimpleMASignal: boolean;
    }) => Array<{ MACD?: number; signal?: number }>;
  };
  export const BollingerBands: {
    calculate: (options: {
      values: number[];
      period: number;
      stdDev: number;
    }) => Array<{ upper?: number; lower?: number }>;
  };
}
