import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface BitcoinPricePoint {
  date: string;
  price: number;
}

export const useBitcoinPrice = () => {
  const { data: rawData, isLoading, error } = useQuery({
    queryKey: ['bitcoin-price-data'],
    queryFn: async (): Promise<BitcoinPricePoint[]> => {
      console.log('Fetching Bitcoin price data...');
      
      // Using CoinGecko API for Bitcoin price history
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=365&interval=daily'
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Bitcoin price data: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Process the data to match expected format
      const processedData = data.prices.map((item: [number, number]) => ({
        date: new Date(item[0]).toISOString().split('T')[0],
        price: item[1]
      }));
      
      return processedData;
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: false,
  });

  return {
    data: rawData || [],
    loading: isLoading,
    error
  };
};