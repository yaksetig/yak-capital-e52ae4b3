
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
        <Card className="p-4 flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Current Price</p>
            <p className="text-xl font-bold">{marketData.currentPrice}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">RSI (14)</p>
            <p className="text-xl font-bold">{marketData.rsi}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Stochastic</p>
            <p className="text-xl font-bold">{marketData.stochastic}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <Activity className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">ADX (14)</p>
            <p className="text-xl font-bold">{marketData.adx}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <Brain className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Price Z-Score</p>
            <p className="text-xl font-bold">{marketData.priceZScore}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <Zap className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Fear & Greed</p>
            <p className="text-xl font-bold">{marketData.fearGreed}</p>
          </div>
        </Card>
      </div>

      {/* Chart Controls */}
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">Chart controls will be integrated here</p>
      </Card>

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
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Cycle Analysis</h3>
          <p className="text-sm text-muted-foreground">Cycle strength: {cycleStrength}</p>
          <div className="mt-2 space-y-2">
            {cycles.map((cycle, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <span className="text-sm">{cycle.name}</span>
                <span className="text-sm text-primary">{cycle.daysRemaining} days</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default OverviewTab;
