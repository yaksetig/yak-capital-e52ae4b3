
import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Activity, Clock } from 'lucide-react';
import { CyclePeak, formatCyclePeriod } from '@/utils/cycleAnalysis';

interface CycleAnalysisPanelProps {
  cycles: CyclePeak[];
  cycleStrength: number;
  isVisible: boolean;
}

const CycleAnalysisPanel: React.FC<CycleAnalysisPanelProps> = ({
  cycles,
  cycleStrength,
  isVisible
}) => {
  if (!isVisible) return null;

  const getStrengthColor = (strength: number) => {
    if (strength >= 0.7) return 'text-green-600';
    if (strength >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceVariant = (confidence: number) => {
    if (confidence >= 0.7) return 'default';
    if (confidence >= 0.4) return 'secondary';
    return 'outline';
  };

  return (
    <Card className="p-4 mb-4 bg-gradient-to-r from-background to-muted/20">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Cycle Analysis</h3>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Strength: {cycleStrength}%</span>
            <Progress value={cycleStrength} className="w-20 h-2" />
          </div>
        </div>

        {/* Top 3 Cycles */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Dominant Cycles</h4>
          {cycles.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Insufficient data for cycle analysis</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {cycles.slice(0, 3).map((cycle, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-card rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {formatCyclePeriod(cycle.period)} cycle
                      </span>
                      <span className={`text-xs ${getStrengthColor(cycle.strength)}`}>
                        Strength: {(cycle.strength * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={getConfidenceVariant(cycle.confidence)}>
                      {(cycle.confidence * 100).toFixed(0)}% confidence
                    </Badge>
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${cycle.strength * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Simplified Analysis Note */}
        {cycles.length > 0 && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            <p>
              <strong>Note:</strong> Cycle analysis uses FFT to identify recurring patterns. 
              Higher confidence cycles have stronger historical patterns. 
              Projection lines show potential future cycle influences.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default CycleAnalysisPanel;
