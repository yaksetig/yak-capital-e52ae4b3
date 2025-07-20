
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

interface InfoCardProps {
  title: string;
  shortDescription: string;
  detailedExplanation: string;
  tradingTip?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ 
  title, 
  shortDescription, 
  detailedExplanation, 
  tradingTip 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="p-4 shadow-card border-border">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{shortDescription}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-2"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>
      
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-sm text-foreground mb-3">{detailedExplanation}</p>
          {tradingTip && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs font-medium text-primary mb-1">💡 Trading Tip:</p>
              <p className="text-xs text-muted-foreground">{tradingTip}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default InfoCard;
