
import React from 'react';
import { TabProps } from '@/types/trading';
import NewsSection from '@/components/NewsSection';

interface NewsTabProps extends Pick<TabProps, 'symbol'> {}

const NewsTab: React.FC<NewsTabProps> = ({ symbol }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Market News & Sentiment</h2>
        <p className="text-muted-foreground">
          Stay informed with the latest news and market sentiment for {symbol.toUpperCase()}.
        </p>
      </div>
      
      <NewsSection symbol={symbol} />
    </div>
  );
};

export default NewsTab;
