
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Activity, TrendingUp, BarChart3 } from 'lucide-react';

interface CycleProjectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  cycleId: string | null;
}

const CycleProjectionModal: React.FC<CycleProjectionModalProps> = ({
  isOpen,
  onClose,
  cycleId
}) => {
  const getCycleInfo = (id: string | null) => {
    switch (id) {
      case 'cycle-1':
        return {
          title: 'Cycle 1 Projection',
          description: 'This represents the primary cycle pattern detected in the price data. It shows the strongest recurring pattern based on historical price movements.',
          details: [
            'Based on the most dominant frequency component in the data',
            'Uses Fast Fourier Transform (FFT) analysis to identify patterns',
            'Higher confidence cycles have stronger predictive value',
            'Projections are mathematical extrapolations, not guarantees'
          ],
          color: 'rgba(255, 165, 0, 0.7)',
          icon: TrendingUp
        };
      case 'cycle-2':
        return {
          title: 'Cycle 2 Projection',
          description: 'This represents the second strongest cycle pattern in the price data, often corresponding to medium-term market rhythms.',
          details: [
            'Secondary frequency component with significant strength',
            'May represent weekly or monthly market patterns',
            'Often correlates with institutional trading cycles',
            'Combined with other cycles for comprehensive analysis'
          ],
          color: 'rgba(75, 192, 192, 0.7)',
          icon: BarChart3
        };
      case 'cycle-3':
        return {
          title: 'Cycle 3 Projection',
          description: 'This represents the third cycle pattern, capturing longer-term or smaller recurring patterns in the market.',
          details: [
            'Tertiary frequency component in the analysis',
            'May represent seasonal or quarterly patterns',
            'Lower strength but still statistically significant',
            'Helps refine overall projection accuracy'
          ],
          color: 'rgba(153, 102, 255, 0.7)',
          icon: Activity
        };
      default:
        return {
          title: 'Cycle Analysis',
          description: 'Mathematical analysis of recurring patterns in price data.',
          details: [],
          color: 'rgba(100, 100, 100, 0.7)',
          icon: Activity
        };
    }
  };

  const cycleInfo = getCycleInfo(cycleId);
  const IconComponent = cycleInfo.icon;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconComponent className="w-5 h-5" style={{ color: cycleInfo.color }} />
            {cycleInfo.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">
            {cycleInfo.description}
          </p>
          
          {cycleInfo.details.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Key Points:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {cycleInfo.details.map((detail, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="bg-muted/50 p-3 rounded-lg text-sm">
            <p className="font-medium mb-1">Important Disclaimer:</p>
            <p className="text-muted-foreground">
              Cycle projections are mathematical extrapolations based on historical patterns. 
              They should not be used as the sole basis for trading decisions. 
              Market conditions can change rapidly and patterns may not continue.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CycleProjectionModal;
