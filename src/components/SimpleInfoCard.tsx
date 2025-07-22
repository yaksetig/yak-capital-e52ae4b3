import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface SimpleInfoCardProps {
  title: string;
  value: string;
  change: string;
}

const SimpleInfoCard: React.FC<SimpleInfoCardProps> = ({ title, value, change }) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{change}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleInfoCard;