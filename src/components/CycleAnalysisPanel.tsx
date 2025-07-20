
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
        {/* Simplified Analysis Note */}
        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          <p>
            <strong>Note:</strong> Cycle analysis uses FFT to identify recurring patterns. 
            Higher confidence cycles have stronger historical patterns. 
            Projection lines show potential future cycle influences.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default CycleAnalysisPanel;
