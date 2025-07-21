import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExpand, faCompress } from '@fortawesome/free-solid-svg-icons';
import { saveAs } from 'file-saver';
import { CSVLink } from "react-csv";
import moment from 'moment';
import 'moment-timezone';

import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateATR,
  calculateBollingerBands,
  calculateStochasticArray,
  calculateADX,
  calculateVWAP,
  calculateVWAPArray,
  calculateZScore,
  calculateZScoreArray,
  findSupportResistance,
  calculateStandardDeviation,
  analyzeCycles
} from '../utils/technicalAnalysis';
import { CycleAnalysisModal } from './CycleAnalysisModal';
import { LoadingIndicator } from './LoadingIndicator';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ENDPOINT = process.env.REACT_APP_SOCKET_ENDPOINT || 'http://localhost:5000';
const HISTORICAL_DATA_URL = process.env.REACT_APP_HISTORICAL_DATA_URL || 'http://localhost:5000/historical-data';

const SMA_PERIODS = [20, 50, 200];
const EMA_PERIODS = [20, 50, 200];
const RSI_PERIOD = 14;
const BB_PERIOD = 20;
const BB_MULTIPLIER = 2;
const MACD_FAST = 12;
const MACD_SLOW = 26;
const MACD_SIGNAL = 9;
const STOCH_K_PERIOD = 14;
const STOCH_D_PERIOD = 3;
const ADX_PERIOD = 14;
const ZSCORE_PERIOD = 20;
const SUPPORT_RESISTANCE_PERIODS = 20;
const LOOKBACK_DAYS = 201;

interface TradingDashboardProps {
  symbol: string;
}

export const TradingDashboard: React.FC<TradingDashboardProps> = ({ symbol }) => {
  const [rawData, setRawData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<string>('60');
  const [socket, setSocket] = useState<any>(null);
  const [fullscreen, setFullscreen] = useState<boolean>(false);
  const [showCycleAnalysis, setShowCycleAnalysis] = useState<boolean>(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [loading, setLoading] = useState(true);

  useEffect(() => {
    const newSocket = io(ENDPOINT);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    newSocket.on('realtime-data', (data: any) => {
      setRawData(prevData => {
        // Parse the incoming data
        const newData = JSON.parse(data);
    
        // Check if the timestamp of the new data already exists in the current rawData
        const isDuplicate = prevData.some(item => item[0] === newData[0]);
    
        // If it's a duplicate, replace the old data with the new data
        if (isDuplicate) {
          return prevData.map(item => (item[0] === newData[0] ? newData : item));
        } else {
          // If it's new data, append it to the existing data
          return [...prevData, newData];
        }
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
    });

    return () => {
      newSocket.off('connect');
      newSocket.off('realtime-data');
      newSocket.off('disconnect');
      newSocket.disconnect();
    };
  }, [symbol]);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${HISTORICAL_DATA_URL}?symbol=${symbol}`);
        setRawData(response.data);
      } catch (error) {
        console.error('Error fetching historical data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalData();
  }, [symbol]);

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };

  const chartData = useMemo(() => {
    if (!rawData || rawData.length === 0) return null;

    const labels = rawData.map((candle: any) => {
      const timestamp = parseInt(candle[0]);
      const date = new Date(timestamp);
      return date.toISOString().split('T')[0];
    });

    const prices = rawData.map((candle: any) => parseFloat(candle[4]));

    return {
      labels: labels,
      datasets: [
        {
          label: `${symbol} Price`,
          data: prices,
          fill: false,
          backgroundColor: 'rgba(75,192,192,0.2)',
          borderColor: 'rgba(75,192,192,1)',
          tension: 0.1
        }
      ]
    };
  }, [rawData, symbol]);

  const processedData = useMemo(() => {
    if (!rawData || rawData.length === 0) return { chartData: [], indicators: null, cycles: [], cycleStrength: 0, cycleProjections: [] };

    const prices = rawData.map(candle => parseFloat(candle[4]));
    const volumes = rawData.map(candle => parseFloat(candle[5]));
    
    if (prices.length < LOOKBACK_DAYS) {
      return { chartData: [], indicators: null, cycles: [], cycleStrength: 0, cycleProjections: [] };
    }

    // STEP 1: Calculate ALL indicators on the FULL 201-day dataset FIRST
    const fullSMA20Array = [];
    const fullSMA50Array = [];
    const fullSMA200Array = [];
    const fullEMA20Array = [];
    const fullEMA50Array = [];
    const fullEMA200Array = [];
    const fullBBMidArray = [];
    const fullBBUpArray = [];
    const fullBBLowArray = [];
    const fullRSIArray = [];
    const fullATRArray = [];
    
    // Calculate indicators for the full dataset
    for (let i = 0; i < rawData.length; i++) {
      const pricesUpToThis = prices.slice(0, i + 1);
      const candlesUpToThis = rawData.slice(0, i + 1);
      
      // Calculate SMAs - these will be null until we have enough data points
      fullSMA20Array.push(pricesUpToThis.length >= 20 ? calculateSMA(pricesUpToThis, 20) : null);
      fullSMA50Array.push(pricesUpToThis.length >= 50 ? calculateSMA(pricesUpToThis, 50) : null);
      fullSMA200Array.push(pricesUpToThis.length >= 200 ? calculateSMA(pricesUpToThis, 200) : null);
      
      // Calculate EMAs
      fullEMA20Array.push(pricesUpToThis.length >= 20 ? calculateEMA(pricesUpToThis, 20) : null);
      fullEMA50Array.push(pricesUpToThis.length >= 50 ? calculateEMA(pricesUpToThis, 50) : null);
      fullEMA200Array.push(pricesUpToThis.length >= 200 ? calculateEMA(pricesUpToThis, 200) : null);
      
      fullRSIArray.push(pricesUpToThis.length >= RSI_PERIOD + 1 ? calculateRSI(pricesUpToThis, RSI_PERIOD) : null);
      fullATRArray.push(candlesUpToThis.length >= 15 ? calculateATR(candlesUpToThis, 14) : null);
      
      // Bollinger Bands
      const bbMid = pricesUpToThis.length >= BB_PERIOD ? calculateSMA(pricesUpToThis, BB_PERIOD) : null;
      const bbStd = pricesUpToThis.length >= BB_PERIOD ? calculateStandardDeviation(pricesUpToThis, BB_PERIOD) : null;
      fullBBMidArray.push(bbMid);
      fullBBUpArray.push(bbMid !== null && bbStd !== null ? bbMid + (BB_MULTIPLIER * bbStd) : null);
      fullBBLowArray.push(bbMid !== null && bbStd !== null ? bbMid - (BB_MULTIPLIER * bbStd) : null);
    }

    // Calculate current indicators for summary (using last values that are not null)
    const currentSMAs = {};
    SMA_PERIODS.forEach(period => {
      currentSMAs[`sma${period}`] = prices.length >= period ? calculateSMA(prices, period, 0) : null;
    });

    const currentEMAs = {};
    EMA_PERIODS.forEach(period => {
      currentEMAs[`ema${period}`] = prices.length >= period ? calculateEMA(prices, period) : null;
    });

    const currentRSI = prices.length >= RSI_PERIOD + 1 ? calculateRSI(prices, RSI_PERIOD) : null;
    const currentATR = rawData.length >= 15 ? calculateATR(rawData, 14) : null;
    
    // Bollinger Bands - current values
    const bbMid = prices.length >= BB_PERIOD ? calculateSMA(prices, BB_PERIOD) : null;
    const bbStd = prices.length >= BB_PERIOD ? calculateStandardDeviation(prices, BB_PERIOD) : null;
    const bbUpper = bbMid !== null && bbStd !== null ? bbMid + (BB_MULTIPLIER * bbStd) : null;
    const bbLower = bbMid !== null && bbStd !== null ? bbMid - (BB_MULTIPLIER * bbStd) : null;
    
    // MACD
    const macdResult = prices.length >= MACD_SLOW ? calculateMACD(prices, MACD_FAST, MACD_SLOW, MACD_SIGNAL) : null;
    
    // Stochastic
    const stochastic = rawData.length >= STOCH_K_PERIOD ? calculateStochasticArray(rawData, STOCH_K_PERIOD, STOCH_D_PERIOD) : null;
    
    // ADX
    const adx = rawData.length >= ADX_PERIOD ? calculateADX(rawData, ADX_PERIOD) : null;
    
    // VWAP
    const vwap = calculateVWAP(rawData);
    
    // Price and Volume Z-Scores
    const priceZScore = prices.length >= ZSCORE_PERIOD ? calculateZScore(prices, ZSCORE_PERIOD) : null;
    const volumeZScore = volumes.length >= ZSCORE_PERIOD ? calculateZScore(volumes, ZSCORE_PERIOD) : null;
    
    // Support and Resistance
    const { support, resistance } = findSupportResistance(prices, SUPPORT_RESISTANCE_PERIODS);
    
    // Market Sentiment
    let marketSentiment = "neutral";
    if (currentRSI && currentRSI > 70) marketSentiment = "overbought";
    else if (currentRSI && currentRSI < 30) marketSentiment = "oversold";
    else marketSentiment = "neutral";

    // STEP 2: Now prepare chart data for the selected time window
    const getDaysToShow = (timeRange) => {
      switch(timeRange) {
        case '7': return 7;
        case '30': return 30;
        case '60': return 60;
        case '90': return 90;
        case 'all': return rawData.length;
        default: return 60;
      }
    };
    
    const daysToShow = getDaysToShow(timeRange);
    const chartDataSlice = rawData.slice(-daysToShow);
    
    const vwapArray = calculateVWAPArray(chartDataSlice);
    const priceZScoreArray = calculateZScoreArray(prices, ZSCORE_PERIOD);
    const volumeZScoreArray = calculateZScoreArray(volumes, ZSCORE_PERIOD);
    
    const chartData = chartDataSlice.map((candle, index) => {
      const timestamp = parseInt(candle[0]);
      const price = parseFloat(candle[4]);
      const volume = parseFloat(candle[5]);
      const date = new Date(timestamp);
      
      // FIXED: Calculate the correct index in the full dataset
      const fullDataIndex = rawData.length - daysToShow + index;
      
      // Use pre-calculated indicators from the full dataset - these may be null for early periods
      const sma20 = fullDataIndex >= 0 && fullDataIndex < fullSMA20Array.length ? fullSMA20Array[fullDataIndex] : null;
      const sma50 = fullDataIndex >= 0 && fullDataIndex < fullSMA50Array.length ? fullSMA50Array[fullDataIndex] : null;
      const sma200 = fullDataIndex >= 0 && fullDataIndex < fullSMA200Array.length ? fullSMA200Array[fullDataIndex] : null;
      const ema20 = fullDataIndex >= 0 && fullDataIndex < fullEMA20Array.length ? fullEMA20Array[fullDataIndex] : null;
      const ema50 = fullDataIndex >= 0 && fullDataIndex < fullEMA50Array.length ? fullEMA50Array[fullDataIndex] : null;
      const ema200 = fullDataIndex >= 0 && fullDataIndex < fullEMA200Array.length ? fullEMA200Array[fullDataIndex] : null;
      const rsi = fullDataIndex >= 0 && fullDataIndex < fullRSIArray.length ? fullRSIArray[fullDataIndex] : null;
      const atr = fullDataIndex >= 0 && fullDataIndex < fullATRArray.length ? fullATRArray[fullDataIndex] : null;
      
      const bbMid = fullDataIndex >= 0 && fullDataIndex < fullBBMidArray.length ? fullBBMidArray[fullDataIndex] : null;
      const bbUp = fullDataIndex >= 0 && fullDataIndex < fullBBUpArray.length ? fullBBUpArray[fullDataIndex] : null;
      const bbLow = fullDataIndex >= 0 && fullDataIndex < fullBBLowArray.length ? fullBBLowArray[fullDataIndex] : null;
      
      // Calculate additional indicators that need current context (MACD, Stochastic, ADX)
      const pricesUpToThis = prices.slice(0, fullDataIndex + 1);
      const candlesUpToThis = rawData.slice(0, fullDataIndex + 1);
      
      let macd = null, macdSig = null, macdHist = null;
      if (pricesUpToThis.length >= MACD_SLOW) {
        const macdRes = calculateMACD(pricesUpToThis, MACD_FAST, MACD_SLOW, MACD_SIGNAL);
        if (macdRes) {
          macd = macdRes.macd;
          macdSig = macdRes.signal;
          macdHist = macdRes.histogram;
        }
      }

      // Stochastic for this point
      const stochArrayPoint = calculateStochasticArray(candlesUpToThis, STOCH_K_PERIOD, STOCH_D_PERIOD);
      
      // ADX for this point
      const adxPoint = calculateADX(candlesUpToThis, ADX_PERIOD);

      return {
        date: date.toISOString().split('T')[0],
        timestamp: timestamp,
        price: price,
        volume: volume,
        sma20: sma20,
        sma50: sma50,
        sma200: sma200, // This will now properly show null for early periods and actual values once we have 200+ data points
        ema20: ema20,
        ema50: ema50,
        ema200: ema200,
        bbUpper: bbUp,
        bbMiddle: bbMid,
        bbLower: bbLow,
        rsi: rsi,
        macd: macd,
        macdSignal: macdSig,
        macdHistogram: macdHist,
        atr: atr,
        vwap: vwapArray[index],
        stochK: stochArrayPoint ? stochArrayPoint.stochK : null,
        stochD: stochArrayPoint ? stochArrayPoint.stochD : null,
        adx: adxPoint ? adxPoint.adx : null,
        priceZScore: priceZScoreArray.length > index ? priceZScoreArray[priceZScoreArray.length - daysToShow + index] : null,
        volumeZScore: volumeZScoreArray.length > index ? volumeZScoreArray[volumeZScoreArray.length - daysToShow + index] : null
      };
    });

    // Cycle Analysis
    const cycleResult = showCycleAnalysis ? analyzeCycles(prices) : { cycles: [], cycleStrength: 0, projections: [] };
    
    const indicators = {
      sma: currentSMAs,
      ema: currentEMAs,
      rsi: currentRSI,
      macd: macdResult,
      atr: currentATR,
      bb: {
        upper: bbUpper,
        middle: bbMid,
        lower: bbLower
      },
      stochastic: stochastic,
      adx: adx,
      vwap: vwap,
      priceZScore: priceZScore,
      volumeZScore: volumeZScore,
      support: support,
      resistance: resistance,
      marketSentiment: marketSentiment
    };

    return {
      chartData,
      indicators,
      cycles: cycleResult.cycles,
      cycleStrength: cycleResult.cycleStrength,
      cycleProjections: cycleResult.projections
    };
  }, [rawData, showCycleAnalysis, timeRange]);

  const toggleCycleAnalysis = () => {
    setShowCycleAnalysis(!showCycleAnalysis);
		setIsModalOpen(!isModalOpen);
  };

  const handleTimeRangeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeRange(event.target.value);
  };

  const downloadData = () => {
    if (processedData && processedData.chartData) {
      const csvData = processedData.chartData.map(item => {
        return {
          date: item.date,
          timestamp: item.timestamp,
          price: item.price,
          volume: item.volume,
          sma20: item.sma20,
          sma50: item.sma50,
          sma200: item.sma200,
          ema20: item.ema20,
          ema50: item.ema50,
          ema200: item.ema200,
          bbUpper: item.bbUpper,
          bbMiddle: item.bbMiddle,
          bbLower: item.bbLower,
          rsi: item.rsi,
          macd: item.macd,
          macdSignal: item.macdSignal,
          macdHistogram: item.macdHistogram,
          atr: item.atr,
          vwap: item.vwap,
          stochK: item.stochK,
          stochD: item.stochD,
          adx: item.adx,
          priceZScore: item.priceZScore,
          volumeZScore: item.volumeZScore
        };
      });

      const filename = `${symbol}_data.csv`;
      const csvString = convertToCSV(csvData);
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, filename);
    }
  };

  const convertToCSV = (objArray: any[]) => {
    const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    let str = '';

    for (let i = 0; i < array.length; i++) {
      let line = '';
      for (const index in array[i]) {
        if (line !== '') line += ',';

        line += array[i][index];
      }

      str += line + '\r\n';
    }

    return str;
  };

  const csvHeaders = [
    { label: "Date", key: "date" },
    { label: "Timestamp", key: "timestamp" },
    { label: "Price", key: "price" },
    { label: "Volume", key: "volume" },
    { label: "SMA20", key: "sma20" },
    { label: "SMA50", key: "sma50" },
    { label: "SMA200", key: "sma200" },
    { label: "EMA20", key: "ema20" },
    { label: "EMA50", key: "ema50" },
    { label: "EMA200", key: "ema200" },
    { label: "BB Upper", key: "bbUpper" },
    { label: "BB Middle", key: "bbMiddle" },
    { label: "BB Lower", key: "bbLower" },
    { label: "RSI", key: "rsi" },
    { label: "MACD", key: "macd" },
    { label: "MACD Signal", key: "macdSignal" },
    { label: "MACD Histogram", key: "macdHistogram" },
    { label: "ATR", key: "atr" },
    { label: "VWAP", key: "vwap" },
    { label: "Stoch K", key: "stochK" },
    { label: "Stoch D", key: "stochD" },
    { label: "ADX", key: "adx" },
    { label: "Price Z-Score", key: "priceZScore" },
    { label: "Volume Z-Score", key: "volumeZScore" },
  ];

  const csvReport = {
    data: processedData?.chartData || [],
    headers: csvHeaders,
    filename: `${symbol}_data.csv`
  };

  const containerClass = fullscreen ? 'fullscreen-chart-container' : 'chart-container';

  return (
    <div className={containerClass}>
      <h2>{symbol} Trading Dashboard</h2>
			{loading && <LoadingIndicator />}
      <div className="controls">
        <select value={timeRange} onChange={handleTimeRangeChange}>
          <option value="7">7 Days</option>
          <option value="30">30 Days</option>
          <option value="60">60 Days</option>
          <option value="90">90 Days</option>
          <option value="all">All Data</option>
        </select>
        <button onClick={toggleFullscreen}>
          <FontAwesomeIcon icon={fullscreen ? faCompress : faExpand} />
        </button>
				<button onClick={toggleCycleAnalysis}>
					Cycle Analysis
				</button>
        <button onClick={downloadData}>Download Data (Manual)</button>
        <CSVLink {...csvReport}>Download CSV</CSVLink>
      </div>
      {chartData && (
        <Line
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
          }}
        />
      )}
			<CycleAnalysisModal 
				isOpen={isModalOpen} 
				onClose={toggleCycleAnalysis} 
				cycleData={processedData}
			/>
      {processedData && processedData.indicators && (
        <div className="indicators">
          <h3>Key Indicators</h3>
          <p>Market Sentiment: {processedData.indicators.marketSentiment}</p>
          <p>Support Level: {processedData.indicators.support ? processedData.indicators.support.toFixed(2) : 'N/A'}</p>
          <p>Resistance Level: {processedData.indicators.resistance ? processedData.indicators.resistance.toFixed(2) : 'N/A'}</p>
          <p>SMA(20): {processedData.indicators.sma?.sma20 ? processedData.indicators.sma.sma20.toFixed(2) : 'N/A'}</p>
          <p>SMA(50): {processedData.indicators.sma?.sma50 ? processedData.indicators.sma.sma50.toFixed(2) : 'N/A'}</p>
          <p>SMA(200): {processedData.indicators.sma?.sma200 ? processedData.indicators.sma.sma200.toFixed(2) : 'N/A'}</p>
          <p>EMA(20): {processedData.indicators.ema?.ema20 ? processedData.indicators.ema.ema20.toFixed(2) : 'N/A'}</p>
          <p>EMA(50): {processedData.indicators.ema?.ema50 ? processedData.indicators.ema.ema50.toFixed(2) : 'N/A'}</p>
          <p>EMA(200): {processedData.indicators.ema?.ema200 ? processedData.indicators.ema.ema200.toFixed(2) : 'N/A'}</p>
          <p>RSI: {processedData.indicators.rsi ? processedData.indicators.rsi.toFixed(2) : 'N/A'}</p>
          <p>ATR: {processedData.indicators.atr ? processedData.indicators.atr.toFixed(2) : 'N/A'}</p>
          <p>BB Upper: {processedData.indicators.bb?.upper ? processedData.indicators.bb.upper.toFixed(2) : 'N/A'}</p>
          <p>BB Middle: {processedData.indicators.bb?.middle ? processedData.indicators.bb.middle.toFixed(2) : 'N/A'}</p>
          <p>BB Lower: {processedData.indicators.bb?.lower ? processedData.indicators.bb.lower.toFixed(2) : 'N/A'}</p>
          <p>MACD: {processedData.indicators.macd?.macd ? processedData.indicators.macd.macd.toFixed(2) : 'N/A'}</p>
          <p>MACD Signal: {processedData.indicators.macd?.signal ? processedData.indicators.macd.signal.toFixed(2) : 'N/A'}</p>
          <p>MACD Histogram: {processedData.indicators.macd?.histogram ? processedData.indicators.macd.histogram.toFixed(2) : 'N/A'}</p>
          <p>Stochastic K: {processedData.indicators.stochastic?.stochK ? processedData.indicators.stochastic.stochK.toFixed(2) : 'N/A'}</p>
          <p>Stochastic D: {processedData.indicators.stochastic?.stochD ? processedData.indicators.stochastic.stochD.toFixed(2) : 'N/A'}</p>
          <p>ADX: {processedData.indicators.adx ? processedData.indicators.adx.adx.toFixed(2) : 'N/A'}</p>
          <p>VWAP: {processedData.indicators.vwap ? processedData.indicators.vwap.toFixed(2) : 'N/A'}</p>
          <p>Price Z-Score: {processedData.indicators.priceZScore ? processedData.indicators.priceZScore.toFixed(2) : 'N/A'}</p>
          <p>Volume Z-Score: {processedData.indicators.volumeZScore ? processedData.indicators.volumeZScore.toFixed(2) : 'N/A'}</p>
        </div>
      )}
    </div>
  );
};
