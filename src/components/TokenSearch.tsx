import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface TokenSearchProps {
  onSearch: (symbol: string) => void;
  isLoading: boolean;
}

export const TokenSearch = ({ onSearch, isLoading }: TokenSearchProps) => {
  const [symbol, setSymbol] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (symbol.trim()) {
      onSearch(symbol.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-md">
      <Input
        placeholder="Enter token symbol (e.g. PEPE)"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        className="flex-1"
      />
      <Button type="submit" disabled={isLoading || !symbol.trim()}>
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
        ) : (
          <Search className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
};