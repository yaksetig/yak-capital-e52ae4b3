
import React from 'react';
import { Card } from '@/components/ui/card';
import InfoCard from '@/components/InfoCard';
import ChartControls from '@/components/ChartControls';
import CycleAnalysisPanel from '@/components/CycleAnalysisPanel';
import TimeSeriesMomentumChart from '@/components/TimeSeriesMomentumChart';
import { DollarSign, TrendingUp, BarChart3, Activity, Brain, Zap } from 'lucide-react';

interface OverviewTabProps {
  chartData: any[];
  chartHeight: number;
  formatDate: (date: string) => string;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  marketData: {
    currentPrice: string;
    rsi: string;
    stochastic: string;
    adx: string;
    priceZScore: string;
    fearGreed: string;
  };
  movingAverages: Array<{
    period: number;
    value: number;
    distance: number;
    signal: string;
  }>;
  cycles: Array<{
    name: string;
    daysRemaining: number;
    strength: number;
    phase: string;
  }>;
  cycleStrength: number;
  showCycleAnalysis: boolean;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  chartData,
  chartHeight,
  formatDate,
  timeRange,
  onTimeRangeChange,
  marketData,
  movingAverages,
  cycles,
  cycleStrength,
  showCycleAnalysis
}) => {
  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <InfoCard
          title="Current Price"
          content={marketData.currentPrice}
          icon={DollarSign}
        />
        <InfoCard
          title="RSI (14)"
          content={marketData.rsi}
          icon={TrendingUp}
        />
        <InfoCard
          title="Stochastic"
          content={marketData.stochastic}
          icon={BarChart3}
        />
        <InfoCard
          title="ADX (14)"
          content={marketData.adx}
          icon={Activity}
        />
        <InfoCard
          title="Price Z-Score"
          content={marketData.priceZScore}
          icon={Brain}
        />
        <InfoCard
          title="Fear & Greed"
          content={marketData.fearGreed}
          icon={Zap}
        />
      </div>

      {/* Chart Controls */}
      <ChartControls />

      {/* Main Price Chart */}
      <TimeSeriesMomentumChart
        chartData={chartData}
        chartHeight={chartHeight}
        formatDate={formatDate}
        timeRange={timeRange}
        onTimeRangeChange={onTimeRangeChange}
      />

      {/* Moving Averages Summary */}
      <Card className="p-6 shadow-card border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Moving Averages Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground">Period</th>
                <th className="text-left py-2 text-muted-foreground">Value</th>
                <th className="text-left py-2 text-muted-foreground">Distance</th>
                <th className="text-left py-2 text-muted-foreground">Signal</th>
              </tr>
            </thead>
            <tbody>
              {movingAverages.map((ma) => (
                <tr key={ma.period} className="border-b border-border/50">
                  <td className="py-2 text-foreground">MA{ma.period}</td>
                  <td className="py-2 text-foreground">${ma.value.toLocaleString()}</td>
                  <td className={`py-2 ${ma.distance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {ma.distance >= 0 ? '+' : ''}{ma.distance.toFixed(2)}%
                  </td>
                  <td className={`py-2 font-medium ${
                    ma.signal === 'Bullish' ? 'text-green-500' : 
                    ma.signal === 'Bearish' ? 'text-red-500' : 'text-yellow-500'
                  }`}>
                    {ma.signal}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Cycle Analysis Panel */}
      {showCycleAnalysis && (
        <CycleAnalysisPanel
          cycles={cycles}
          cycleStrength={cycleStrength}
          isVisible={showCycleAnalysis}
        />
      )}
    </div>
  );
};

export default OverviewTab;
