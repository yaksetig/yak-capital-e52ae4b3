
import React from 'react';
import { Card } from '@/components/ui/card';
import MACDChart from '@/components/MACDChart';
import StochasticChart from '@/components/StochasticChart';
import ROCChart from '@/components/ROCChart';

interface TechnicalAnalysisTabProps {
  chartData: any[];
  chartHeight: number;
  formatDate: (date: string) => string;
  rsiData: any[];
  cciData: any[];
  adxData: any[];
  priceZScoreData: any[];
  volumeZScoreData: any[];
  bitcoinTVLData: any[];
}

const TechnicalAnalysisTab: React.FC<TechnicalAnalysisTabProps> = ({
  chartData,
  chartHeight,
  formatDate,
  rsiData,
  cciData,
  adxData,
  priceZScoreData,
  volumeZScoreData,
  bitcoinTVLData
}) => {
  // RSI Chart Component
  const RSIChart = () => (
    <Card className="p-6 shadow-card border-border">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Relative Strength Index (RSI)</h2>
          <p className="text-sm text-muted-foreground">
            RSI measures the speed and magnitude of recent price changes to evaluate overvalued or undervalued conditions.
          </p>
        </div>
      </div>
      {/* RSI Chart implementation would go here */}
    </Card>
  );

  // CCI Chart Component
  const CCIChart = () => (
    <Card className="p-6 shadow-card border-border">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Commodity Channel Index (CCI)</h2>
          <p className="text-sm text-muted-foreground">
            CCI measures the current price level relative to an average price level over a given period of time.
          </p>
        </div>
      </div>
      {/* CCI Chart implementation would go here */}
    </Card>
  );

  // ADX Chart Component
  const ADXChart = () => (
    <Card className="p-6 shadow-card border-border">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Average Directional Index (ADX)</h2>
          <p className="text-sm text-muted-foreground">
            ADX measures the strength of a trend, regardless of direction. Values above 25 indicate a strong trend.
          </p>
        </div>
      </div>
      {/* ADX Chart implementation would go here */}
    </Card>
  );

  // Price Z-Score Chart Component
  const PriceZScoreChart = () => (
    <Card className="p-6 shadow-card border-border">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Price Z-Score</h2>
          <p className="text-sm text-muted-foreground">
            Z-Score measures how many standard deviations the current price is from the mean.
          </p>
        </div>
      </div>
      {/* Price Z-Score Chart implementation would go here */}
    </Card>
  );

  // Volume Z-Score Chart Component
  const VolumeZScoreChart = () => (
    <Card className="p-6 shadow-card border-border">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Volume Z-Score</h2>
          <p className="text-sm text-muted-foreground">
            Volume Z-Score measures how unusual current trading volume is compared to historical norms.
          </p>
        </div>
      </div>
      {/* Volume Z-Score Chart implementation would go here */}
    </Card>
  );

  // Bitcoin vs TVL Chart Component
  const BitcoinTVLChart = () => (
    <Card className="p-6 shadow-card border-border">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Bitcoin Price vs TVL</h2>
          <p className="text-sm text-muted-foreground">
            Comparison of Bitcoin price movements with Total Value Locked in DeFi protocols.
          </p>
        </div>
      </div>
      {/* Bitcoin vs TVL Chart implementation would go here */}
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Technical Indicators Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Row 1 */}
        <RSIChart />
        <MACDChart 
          chartData={chartData}
          chartHeight={chartHeight}
          formatDate={formatDate}
        />
        
        {/* Row 2 */}
        <StochasticChart 
          chartData={chartData}
          chartHeight={chartHeight}
          formatDate={formatDate}
        />
        <CCIChart />
        
        {/* Row 3 */}
        <ADXChart />
        <PriceZScoreChart />
        
        {/* Row 4 */}
        <VolumeZScoreChart />
        <ROCChart 
          chartData={chartData}
          chartHeight={chartHeight}
          formatDate={formatDate}
        />
        
        {/* Row 5 - Full width */}
        <div className="lg:col-span-2">
          <BitcoinTVLChart />
        </div>
      </div>
    </div>
  );
};

export default TechnicalAnalysisTab;
