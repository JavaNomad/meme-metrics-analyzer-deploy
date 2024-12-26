import { useState } from "react";
import { TokenSearch } from "@/components/TokenSearch";
import { MetricsCard } from "@/components/MetricsCard";
import { AnalysisDisplay } from "@/components/AnalysisDisplay";
import { useToast } from "@/components/ui/use-toast";
import { analyzeWithGPT } from "@/lib/openai";

interface TokenMetrics {
  buyPressureRatio: number;
  liquidityConcentration: number;
  volumeLiquidityRatio: number;
  priceDeviation: number;
}

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [metrics, setMetrics] = useState<TokenMetrics | null>(null);
  const { toast } = useToast();

  const handleSearch = async (symbol: string) => {
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

      const calculatedMetrics = {
        buyPressureRatio: totalBuys / (totalSells || 1),
        liquidityConcentration: (mainPair.liquidity?.usd || 0) / (totalLiquidity || 1),
        volumeLiquidityRatio: totalVolume / (totalLiquidity || 1),
        priceDeviation: basePairs.length > 1 
          ? Math.max(...basePairs.map((p: any) => parseFloat(p.priceUsd || '0'))) / 
            Math.min(...basePairs.map((p: any) => parseFloat(p.priceUsd || '1'))) - 1
          : 0
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

  const handleExport = () => {
    if (!analysis) return;
    
    const timestamp = new Date().toISOString();
    const content = `${analysis}\n\nAnalysis generated at: ${timestamp}`;
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `token-analysis-${timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <div className="container py-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Base Meme Token Analyzer</h1>
          <p className="text-muted-foreground">
            Analyze meme tokens on the Base ecosystem with AI-powered insights
          </p>
        </div>

        <div className="flex justify-center">
          <TokenSearch onSearch={handleSearch} isLoading={isLoading} />
        </div>

        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricsCard
              title="Buy/Sell Pressure"
              value={metrics.buyPressureRatio.toFixed(2)}
              trend={metrics.buyPressureRatio > 1 ? "positive" : "negative"}
              description="Ratio of buy to sell transactions"
            />
            <MetricsCard
              title="Liquidity Concentration"
              value={`${(metrics.liquidityConcentration * 100).toFixed(2)}%`}
              trend={metrics.liquidityConcentration > 0.5 ? "positive" : "neutral"}
              description="Percentage of total liquidity in main pair"
            />
            <MetricsCard
              title="Volume/Liquidity Ratio"
              value={metrics.volumeLiquidityRatio.toFixed(2)}
              trend={metrics.volumeLiquidityRatio > 0.5 ? "positive" : "neutral"}
              description="24h volume relative to liquidity"
            />
            <MetricsCard
              title="Price Deviation"
              value={`${(metrics.priceDeviation * 100).toFixed(2)}%`}
              trend={metrics.priceDeviation < 0.05 ? "positive" : "negative"}
              description="Price difference across pairs"
            />
          </div>
        )}

        {analysis && (
          <AnalysisDisplay analysis={analysis} onExport={handleExport} />
        )}
      </div>
    </div>
  );
};

export default Index;