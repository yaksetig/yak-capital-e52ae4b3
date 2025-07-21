
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import NewsSection from '@/components/NewsSection';
import { Newspaper, Calendar, Globe } from 'lucide-react';

interface MarketNewsTabProps {
  symbol: string;
}

const MarketNewsTab: React.FC<MarketNewsTabProps> = ({ symbol }) => {
  return (
    <div className="space-y-6">
      {/* Main News Section */}
      <NewsSection symbol={symbol} />

      {/* Market Events Calendar Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Upcoming Market Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 border border-border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Federal Reserve Meeting</p>
                  <p className="text-xs text-muted-foreground">Interest rate decision</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Tomorrow</p>
                  <p className="text-xs font-medium">High Impact</p>
                </div>
              </div>
            </div>
            
            <div className="p-3 border border-border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">CPI Data Release</p>
                  <p className="text-xs text-muted-foreground">Consumer Price Index</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">In 3 days</p>
                  <p className="text-xs font-medium">Medium Impact</p>
                </div>
              </div>
            </div>
            
            <div className="p-3 border border-border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Bitcoin Conference 2024</p>
                  <p className="text-xs text-muted-foreground">Industry event</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Next week</p>
                  <p className="text-xs font-medium">Low Impact</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Sentiment Tracker Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Social Sentiment Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm">Twitter Sentiment</span>
              <div className="flex items-center gap-2">
                <div className="w-12 h-2 bg-green-200 rounded-full">
                  <div className="w-8 h-2 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-xs font-medium text-green-600">Bullish</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm">Reddit Sentiment</span>
              <div className="flex items-center gap-2">
                <div className="w-12 h-2 bg-yellow-200 rounded-full">
                  <div className="w-6 h-2 bg-yellow-500 rounded-full"></div>
                </div>
                <span className="text-xs font-medium text-yellow-600">Neutral</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm">News Sentiment</span>
              <div className="flex items-center gap-2">
                <div className="w-12 h-2 bg-green-200 rounded-full">
                  <div className="w-9 h-2 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-xs font-medium text-green-600">Positive</span>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground bg-muted/20 rounded p-2">
              📊 Social sentiment data is aggregated from multiple sources and updated hourly.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketNewsTab;
