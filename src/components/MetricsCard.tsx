import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricsCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: "positive" | "negative" | "neutral";
}

export const MetricsCard = ({ title, value, description, trend }: MetricsCardProps) => {
  return (
    <Card className="bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          <span
            className={cn(
              trend === "positive" && "text-success",
              trend === "negative" && "text-danger",
              trend === "neutral" && "text-warning"
            )}
          >
            {value}
          </span>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};