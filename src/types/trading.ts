
export interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  rsi: number | null;
  macd: {
    macd: number | null;
    signal: number | null;
    histogram: number | null;
  };
  stochastic: {
    k: number | null;
    d: number | null;
  };
  sma20: number | null;
  sma50: number | null;
  ema12: number | null;
  ema26: number | null;
}

export interface ProcessedChartData {
  date: string;
  price: number;
  volume: number;
  rsi: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  stochK: number | null;
  stochD: number | null;
  sma20: number | null;
  sma50: number | null;
}

export interface TabProps {
  rawData: CandleData[];
  indicators: TechnicalIndicators;
  chartData: ProcessedChartData[];
  loading: boolean;
  error: string | null;
  symbol: string;
  timeRange: string;
  interval: string;
  onTimeRangeChange: (range: string) => void;
  onIntervalChange: (interval: string) => void;
}
