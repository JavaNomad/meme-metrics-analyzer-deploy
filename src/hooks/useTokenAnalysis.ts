import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { analyzeWithGPT } from "@/lib/openai";

interface TokenMetrics {
  buyPressureRatio: number;
  liquidityConcentration: number;
  volumeLiquidityRatio: number;
  priceDeviation: number;
  tokenName: string;
  currentPrice: number;
  highestVolumePair: {
    pair: string;
    volume: number;
  };
}

export const useTokenAnalysis = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [metrics, setMetrics] = useState<TokenMetrics | null>(null);
  const { toast } = useToast();

  const analyzeToken = async (symbol: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://api.dexscreener.com/latest/dex/search/?q=${symbol}`);
      if (!response.ok) throw new Error("Failed to fetch token data");
      
      const data = await response.json();
      const basePairs = data.pairs?.filter((pair: any) => 
        pair.chainId === "base" && 
        pair.baseToken.symbol.toLowerCase() === symbol.toLowerCase()
      ) || [];

      if (basePairs.length === 0) {
        throw new Error(`No pairs found for ${symbol} on Base ecosystem`);
      }

      // Calculate metrics
      const mainPair = basePairs[0];
      const totalVolume = basePairs.reduce((sum: number, pair: any) => sum + (pair.volume?.h24 || 0), 0);
      const totalLiquidity = basePairs.reduce((sum: number, pair: any) => sum + (pair.liquidity?.usd || 0), 0);
      const totalBuys = basePairs.reduce((sum: number, pair: any) => sum + (pair.txns?.h24?.buys || 0), 0);
      const totalSells = basePairs.reduce((sum: number, pair: any) => sum + (pair.txns?.h24?.sells || 0), 0);

      // Find pair with highest volume
      const highestVolumePair = basePairs.reduce((highest: any, current: any) => {
        return (current.volume?.h24 || 0) > (highest.volume?.h24 || 0) ? current : highest;
      }, basePairs[0]);

      const calculatedMetrics = {
        buyPressureRatio: totalBuys / (totalSells || 1),
        liquidityConcentration: (mainPair.liquidity?.usd || 0) / (totalLiquidity || 1),
        volumeLiquidityRatio: totalVolume / (totalLiquidity || 1),
        priceDeviation: basePairs.length > 1 
          ? Math.max(...basePairs.map((p: any) => parseFloat(p.priceUsd || '0'))) / 
            Math.min(...basePairs.map((p: any) => parseFloat(p.priceUsd || '1'))) - 1
          : 0,
        tokenName: mainPair.baseToken.name || symbol,
        currentPrice: parseFloat(mainPair.priceUsd || '0'),
        highestVolumePair: {
          pair: `${highestVolumePair.baseToken.symbol}/${highestVolumePair.quoteToken.symbol}`,
          volume: highestVolumePair.volume?.h24 || 0
        }
      };

      setMetrics(calculatedMetrics);

      // Generate analysis prompt
      const prompt = `
        Analyze the following MEME coin data on the Base ecosystem and provide an in-depth technical analysis:

        Token: ${symbol}
        Price: $${parseFloat(mainPair.priceUsd || '0').toFixed(8)}
        24h Volume: $${totalVolume.toLocaleString()}
        Liquidity: $${totalLiquidity.toLocaleString()}
        24h Transactions: ${totalBuys + totalSells} (${totalBuys} buys, ${totalSells} sells)

        Metrics:
        Buy/Sell Pressure Ratio: ${calculatedMetrics.buyPressureRatio.toFixed(2)}
        Liquidity Concentration: ${calculatedMetrics.liquidityConcentration.toFixed(2)}
        Volume/Liquidity Ratio: ${calculatedMetrics.volumeLiquidityRatio.toFixed(2)}
        Price Deviation: ${(calculatedMetrics.priceDeviation * 100).toFixed(2)}%

        Provide a detailed analysis of the token's performance, potential risks, and opportunities. Consider:
        1. Market sentiment based on buy/sell ratio
        2. Liquidity health and distribution
        3. Trading volume relative to liquidity
        4. Price arbitrage opportunities across pairs
        5. Overall market dynamics on Base ecosystem

        End with a clear strong sell / sell / hold / buy / strong buy recommendation.
      `;

      const analysis = await analyzeWithGPT(prompt);
      setAnalysis(analysis);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to analyze token",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    analysis,
    metrics,
    analyzeToken
  };
};