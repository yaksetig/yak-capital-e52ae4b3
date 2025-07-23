import React, { useMemo } from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '@/components/ui/card';

interface OBVChartProps {
  chartData: any[];
  chartHeight: number;
  formatDate: (date: string) => string;
  formatPriceShort: (value: number) => string;
}

const OBVChart: React.FC<OBVChartProps> = ({ chartData, chartHeight, formatDate, formatPriceShort }) => {
  const formatOBV = (value: number) => {
    if (value === null || value === undefined || isNaN(value)) return '';
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
    return value.toFixed(0);
  };

  const obvPriceCorrelation = useMemo(() => {
    const validPoints = chartData.filter(d => typeof d.price === 'number' && typeof d.obv === 'number');
    if (validPoints.length === 0) return null;

    const n = validPoints.length;
    const meanPrice = validPoints.reduce((sum, p) => sum + p.price, 0) / n;
    const meanObv = validPoints.reduce((sum, p) => sum + p.obv, 0) / n;
    let cov = 0, varPrice = 0, varObv = 0;
    for (const point of validPoints) {
      const dp = point.price - meanPrice;
      const dv = point.obv - meanObv;
      cov += dp * dv;
      varPrice += dp * dp;
      varObv += dv * dv;
    }
    const denom = Math.sqrt(varPrice * varObv);
    if (denom === 0) return 0;
    return cov / denom;
  }, [chartData]);

  return (
    <Card className="p-6 shadow-card border-border">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">On-Balance Volume (OBV)</h2>
          <p className="text-sm text-muted-foreground">
            OBV adds volume on up days and subtracts it on down days to gauge buying and selling pressure.
          </p>
          {obvPriceCorrelation !== null && (
            <p className="text-sm mt-2">
              <span className="text-muted-foreground">Correlation with Price: </span>
              <span className="font-semibold">{obvPriceCorrelation.toFixed(2)}</span>
            </p>
          )}
        </div>
      </div>
      <div className="bg-chart-bg rounded-lg p-4" style={{ height: chartHeight * 0.7 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
            <XAxis dataKey="date" tickFormatter={formatDate} stroke="hsl(var(--muted-foreground))" />
            <YAxis yAxisId="price" orientation="left" tickFormatter={formatPriceShort} stroke="hsl(var(--muted-foreground))" />
            <YAxis yAxisId="obv" orientation="right" tickFormatter={formatOBV} stroke="hsl(var(--chart-2))" />
            <Tooltip
              formatter={(value, name) => {
                if (name === 'Price') return [formatPriceShort(Number(value)), name];
                if (name === 'OBV') return [formatOBV(Number(value)), name];
                return [value, name];
              }}
              labelFormatter={(label) => `Date: ${formatDate(label)}`}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))'
              }}
            />
            <Legend />
            <Line yAxisId="price" type="monotone" dataKey="price" stroke="hsl(var(--foreground))" strokeWidth={2} name="Price" dot={false} isAnimationActive={false} />
            <Line yAxisId="obv" type="monotone" dataKey="obv" stroke="hsl(var(--chart-2))" strokeWidth={2} name="OBV" dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default OBVChart;
