
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, TrendingUp, BarChart3, Brain } from 'lucide-react';

const LearnTab: React.FC = () => {
  const learningResources = [
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Technical Analysis Basics",
      description: "Learn how to read price charts, identify trends, and understand support/resistance levels.",
      topics: ["Candlestick Patterns", "Support & Resistance", "Trend Lines", "Chart Patterns"]
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Key Indicators",
      description: "Master the most important technical indicators used in crypto trading.",
      topics: ["RSI (Relative Strength Index)", "MACD", "Moving Averages", "Stochastic Oscillator"]
    },
    {
      icon: <Brain className="h-6 w-6" />,
      title: "Trading Psychology",
      description: "Develop the right mindset and emotional control for successful trading.",
      topics: ["Risk Management", "Position Sizing", "Fear & Greed", "Trading Discipline"]
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Market Analysis",
      description: "Understand how to analyze market conditions and make informed decisions.",
      topics: ["Market Cycles", "Volume Analysis", "News Impact", "Correlation Analysis"]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Learn Trading</h2>
        <p className="text-muted-foreground">
          Master the fundamentals of cryptocurrency trading with our comprehensive learning resources.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {learningResources.map((resource, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  {resource.icon}
                </div>
                <CardTitle className="text-lg">{resource.title}</CardTitle>
              </div>
              <CardDescription>{resource.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Key Topics:</p>
                <ul className="space-y-1">
                  {resource.topics.map((topic, topicIndex) => (
                    <li key={topicIndex} className="text-sm text-muted-foreground flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Trading Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Risk Management</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Never risk more than 2% per trade</li>
                <li>• Always set stop-loss orders</li>
                <li>• Diversify your portfolio</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Technical Analysis</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use multiple timeframes</li>
                <li>• Confirm signals with volume</li>
                <li>• Wait for clear breakouts</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LearnTab;
