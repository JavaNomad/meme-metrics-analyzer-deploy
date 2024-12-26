import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface AnalysisDisplayProps {
  analysis: string;
  onExport: () => void;
}

export const AnalysisDisplay = ({ analysis, onExport }: AnalysisDisplayProps) => {
  return (
    <Card className="bg-card/50 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Analysis</CardTitle>
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </CardHeader>
      <CardContent>
        <div className="prose prose-invert max-w-none">
          {analysis.split("\n").map((line, i) => (
            <p key={i} className="mb-4">
              {line}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};