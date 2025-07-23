import React from 'react';
import { Card } from '@/components/ui/card';
import InfoCard from './InfoCard';

const educationalContent = [
  {
    title: 'Moving Averages (SMA/EMA)',
    shortDescription: 'Trend direction and momentum indicators',
    detailedExplanation:
      'Simple Moving Average (SMA) calculates the average price over a specific period, while Exponential Moving Average (EMA) gives more weight to recent prices. They help identify trend direction and potential support/resistance levels.',
    tradingTip:
      'When price is above the moving average, it suggests an uptrend. Golden Cross (SMA 50 > SMA 200) is a bullish signal, while Death Cross is bearish.'
  },
  {
    title: 'RSI (Relative Strength Index)',
    shortDescription: 'Momentum oscillator measuring overbought/oversold conditions',
    detailedExplanation:
      'RSI ranges from 0-100. Values above 70 typically indicate overbought conditions (potential sell signal), while values below 30 suggest oversold conditions (potential buy signal). RSI also shows momentum and can indicate trend strength.',
    tradingTip:
      "Look for RSI divergences with price action. If price makes new highs but RSI doesn't, it may signal weakening momentum."
  },
  {
    title: 'MACD (Moving Average Convergence Divergence)',
    shortDescription: 'Trend-following momentum indicator',
    detailedExplanation:
      'MACD consists of three components: MACD line (12 EMA - 26 EMA), Signal line (9 EMA of MACD), and Histogram (MACD - Signal). It helps identify trend changes and momentum shifts.',
    tradingTip:
      'Buy signals occur when MACD crosses above the signal line, and sell signals when it crosses below. The histogram shows the strength of the signal.'
  },
  {
    title: 'Bollinger Bands',
    shortDescription: 'Volatility bands showing price channels',
    detailedExplanation:
      'Bollinger Bands consist of a middle line (20 SMA) and two outer bands (±2 standard deviations). They expand and contract based on market volatility, helping identify overbought/oversold conditions and potential breakouts.',
    tradingTip:
      'Prices tend to bounce between the bands. When bands squeeze together, it often precedes a significant price move.'
  },
  {
    title: 'Z-Score Analysis',
    shortDescription: 'Statistical measure of how far a value deviates from the mean',
    detailedExplanation:
      'Z-Score measures how many standard deviations a current value is from the historical average. Values above +2 or below -2 indicate statistically extreme conditions that may signal reversals or continuation patterns.',
    tradingTip:
      'Use Z-scores to identify when prices, volume, or indicators are at extreme levels. High volume Z-scores confirm price moves, while extreme price Z-scores may signal reversal opportunities.'
  }
];

const LearnSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card className="p-6 shadow-card border-border">
        <h2 className="text-2xl font-bold mb-2 text-foreground">Financial Education</h2>
        <p className="text-muted-foreground mb-6">
          Explore key technical indicators and how to interpret them in your trading analysis.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {educationalContent.map((item) => (
            <InfoCard
              key={item.title}
              title={item.title}
              shortDescription={item.shortDescription}
              detailedExplanation={item.detailedExplanation}
              tradingTip={item.tradingTip}
            />
          ))}
        </div>
      </Card>
    </div>
  );
};

export default LearnSection;
