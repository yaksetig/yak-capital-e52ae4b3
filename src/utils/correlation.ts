
/**
 * Calculate Pearson correlation coefficient between two arrays
 * Returns a value between -1 and 1, where:
 * - 1 indicates perfect positive correlation
 * - 0 indicates no correlation
 * - -1 indicates perfect negative correlation
 */
export const calculateCorrelation = (x: number[], y: number[]): number | null => {
  if (x.length !== y.length || x.length < 2) {
    return null;
  }

  // Filter out any null/undefined values
  const validPairs = x.map((xVal, i) => ({ x: xVal, y: y[i] }))
    .filter(pair => pair.x !== null && pair.x !== undefined && 
                   pair.y !== null && pair.y !== undefined &&
                   !isNaN(pair.x) && !isNaN(pair.y));

  if (validPairs.length < 2) {
    return null;
  }

  const validX = validPairs.map(p => p.x);
  const validY = validPairs.map(p => p.y);

  const n = validX.length;
  const sumX = validX.reduce((sum, val) => sum + val, 0);
  const sumY = validY.reduce((sum, val) => sum + val, 0);
  const sumXY = validX.reduce((sum, val, i) => sum + val * validY[i], 0);
  const sumX2 = validX.reduce((sum, val) => sum + val * val, 0);
  const sumY2 = validY.reduce((sum, val) => sum + val * val, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) {
    return null;
  }

  return numerator / denominator;
};

/**
 * Get correlation strength description and color
 */
export const getCorrelationInfo = (correlation: number | null) => {
  if (correlation === null) {
    return { strength: 'N/A', color: 'text-muted-foreground' };
  }

  const abs = Math.abs(correlation);
  
  if (abs >= 0.7) {
    return { 
      strength: correlation > 0 ? 'Strong Positive' : 'Strong Negative', 
      color: 'text-green-600' 
    };
  } else if (abs >= 0.3) {
    return { 
      strength: correlation > 0 ? 'Moderate Positive' : 'Moderate Negative', 
      color: 'text-orange-600' 
    };
  } else {
    return { 
      strength: correlation > 0 ? 'Weak Positive' : 'Weak Negative', 
      color: 'text-red-600' 
    };
  }
};
