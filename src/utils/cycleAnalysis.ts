
// Fast Fourier Transform implementation
interface ComplexNumber {
  re: number;
  im: number;
}

function fft(signal: ComplexNumber[]): ComplexNumber[] {
  const N = signal.length;
  if (N <= 1) return signal;
  
  // Pad to next power of 2 if necessary
  if (N & (N - 1)) {
    const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(N)));
    const padded = [...signal];
    while (padded.length < nextPowerOf2) {
      padded.push({ re: 0, im: 0 });
    }
    return fft(padded).slice(0, N);
  }
  
  // Recursive FFT (simplified version)
  const even = fft(signal.filter((_, i) => i % 2 === 0));
  const odd = fft(signal.filter((_, i) => i % 2 === 1));
  
  const result = new Array(N);
  for (let k = 0; k < N / 2; k++) {
    // Ensure we don't access undefined indices
    if (k >= even.length || k >= odd.length) {
      result[k] = { re: 0, im: 0 };
      result[k + N / 2] = { re: 0, im: 0 };
      continue;
    }
    
    const t = { re: Math.cos(-2 * Math.PI * k / N), im: Math.sin(-2 * Math.PI * k / N) };
    const oddK = { 
      re: odd[k].re * t.re - odd[k].im * t.im, 
      im: odd[k].re * t.im + odd[k].im * t.re 
    };
    
    result[k] = { re: even[k].re + oddK.re, im: even[k].im + oddK.im };
    result[k + N / 2] = { re: even[k].re - oddK.re, im: even[k].im - oddK.im };
  }
  
  return result;
}

export interface CyclePeak {
  frequency: number;
  period: number;
  magnitude: number;
  strength: number; // 0-1 normalized strength
  confidence: number; // 0-1 confidence level
}

// Analyze price cycles
export function analyzeCycles(prices: number[]): CyclePeak[] {
  if (prices.length < 8) return []; // Need minimum data points
  
  // Add input validation
  if (prices.some(p => typeof p !== 'number' || isNaN(p))) {
    console.warn('Invalid price data detected, skipping cycle analysis');
    return [];
  }
  
  try {
    // Convert prices to complex numbers for FFT
    const signal: ComplexNumber[] = prices.map(p => ({ re: p, im: 0 }));
  
    // Apply FFT
    const spectrum = fft(signal);
    
    // Calculate magnitude and find dominant frequencies
    const magnitudes = spectrum.map(c => Math.sqrt(c.re * c.re + c.im * c.im));
    
    // Find peaks (dominant cycles)
    const peaks: CyclePeak[] = [];
    const maxMagnitude = Math.max(...magnitudes.slice(1, magnitudes.length / 2));
    
    for (let i = 1; i < magnitudes.length / 2; i++) {
      if (magnitudes[i] > magnitudes[i-1] && magnitudes[i] > magnitudes[i+1]) {
        const period = prices.length / i; // Convert frequency to period
        const magnitude = magnitudes[i];
        const strength = magnitude / maxMagnitude; // Normalize strength
        
        // Only include cycles with meaningful periods (between 3 and half the data length)
        if (period >= 3 && period <= prices.length / 2 && strength > 0.1) {
          peaks.push({ 
            frequency: i, 
            period: period, 
            magnitude: magnitude,
            strength: strength,
            confidence: Math.min(strength * 2, 1) // Simple confidence calculation
          });
        }
      }
    }
    
    return peaks.sort((a, b) => b.magnitude - a.magnitude).slice(0, 5); // Top 5 cycles
  } catch (error) {
    console.error('Error in cycle analysis:', error);
    return [];
  }
}

// Generate cycle projection points for chart overlay
export interface CycleProjection {
  timestamp: number;
  value: number;
  cycleId: string;
}

export function generateCycleProjections(
  chartData: any[], 
  cycles: CyclePeak[], 
  projectionLength: number = 10
): CycleProjection[] {
  if (chartData.length === 0 || cycles.length === 0) return [];
  
  const projections: CycleProjection[] = [];
  const lastTimestamp = chartData[chartData.length - 1].timestamp;
  const timeInterval = chartData[1]?.timestamp - chartData[0]?.timestamp || 86400000; // Default to 1 day
  
  if (import.meta.env.DEV) {
    console.log('Generating cycle projections:', {
      chartDataLength: chartData.length,
      cycleCount: cycles.length,
      lastTimestamp,
      timeInterval
    });
  }
  
  cycles.slice(0, 3).forEach((cycle, index) => { // Top 3 cycles
    const cyclePhase = (chartData.length % cycle.period) / cycle.period * 2 * Math.PI;
    // Increased amplitude scaling from 0.01 to 0.05 to make projections more visible
    const amplitude = cycle.magnitude * 0.05;
    
    if (import.meta.env.DEV) {
      console.log(`Cycle ${index}:`, {
        period: cycle.period,
        magnitude: cycle.magnitude,
        amplitude,
        strength: cycle.strength
      });
    }
    
    for (let i = 1; i <= projectionLength; i++) {
      const futureTimestamp = lastTimestamp + (i * timeInterval);
      const cycleValue = Math.sin(cyclePhase + (i * 2 * Math.PI / cycle.period)) * amplitude;
      
      projections.push({
        timestamp: futureTimestamp,
        value: cycleValue,
        cycleId: `cycle-${index}`
      });
    }
  });
  
  if (import.meta.env.DEV) {
    console.log('Generated projections:', {
      totalProjections: projections.length,
      sampleValues: projections.slice(0, 5).map(p => p.value)
    });
  }
  
  return projections;
}

// Calculate cycle strength indicator (0-100)
export function calculateCycleStrength(cycles: CyclePeak[]): number {
  if (cycles.length === 0) return 0;
  
  const avgStrength = cycles.slice(0, 3).reduce((sum, cycle) => sum + cycle.strength, 0) / Math.min(cycles.length, 3);
  return Math.round(avgStrength * 100);
}

// Format cycle period for display
export function formatCyclePeriod(period: number): string {
  if (period < 1) {
    return `${(period * 24).toFixed(1)}h`;
  } else if (period < 7) {
    return `${period.toFixed(1)} days`;
  } else if (period < 30) {
    return `${(period / 7).toFixed(1)} weeks`;
  } else {
    return `${(period / 30).toFixed(1)} months`;
  }
}
