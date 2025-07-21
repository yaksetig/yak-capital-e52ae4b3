
import React from 'react';
import { TrendingUp, TrendingDown, Minus, Wifi, WifiOff } from 'lucide-react';

interface LivePriceIndicatorProps {
  currentPrice: number | null;
  priceChange: number;
  priceChangePercent: number;
  lastUpdate: Date | null;
  isLoading: boolean;
  error: string | null;
}

const LivePriceIndicator: React.FC<LivePriceIndicatorProps> = ({
  currentPrice,
  priceChange,
  priceChangePercent,
  lastUpdate,
  isLoading,
  error,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getPriceChangeColor = () => {
    if (priceChange > 0) return 'text-green-500';
    if (priceChange < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  const getPriceChangeIcon = () => {
    if (priceChange > 0) return <TrendingUp className="w-4 h-4" />;
    if (priceChange < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  if (error) {
    return (
      <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-lg">
        <WifiOff className="w-4 h-4 text-destructive" />
        <span className="text-sm text-destructive">Live price unavailable</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-green-500">LIVE</span>
          </div>
          {isLoading ? (
            <WifiOff className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Wifi className="w-4 h-4 text-green-500" />
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">
            {currentPrice ? formatPrice(currentPrice) : '--'}
          </span>
          
          {currentPrice && (
            <div className={`flex items-center gap-1 ${getPriceChangeColor()}`}>
              {getPriceChangeIcon()}
              <span className="text-sm font-medium">
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} 
                ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
              </span>
            </div>
          )}
        </div>
      </div>
      
      {lastUpdate && (
        <div className="text-xs text-muted-foreground">
          Updated: {formatTime(lastUpdate)}
        </div>
      )}
    </div>
  );
};

export default LivePriceIndicator;
