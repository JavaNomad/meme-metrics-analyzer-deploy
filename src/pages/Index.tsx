import { useState } from "react";
import { TokenSearch } from "@/components/TokenSearch";
import { MetricsCard } from "@/components/MetricsCard";
import { AnalysisDisplay } from "@/components/AnalysisDisplay";
import { useToast } from "@/components/ui/use-toast";

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
      const response = await fetch(`/api/analyze?symbol=${symbol}`);
      if (!response.ok) throw new Error("Analysis failed");
      
      const data = await response.json();
      setAnalysis(data.analysis);
      setMetrics(data.metrics);
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