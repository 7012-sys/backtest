import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Pencil, IndianRupee } from "lucide-react";

interface NoTradesStateProps {
  onModifyStrategy: () => void;
  skippedSignals?: number;
}

export const NoTradesState = ({ onModifyStrategy, skippedSignals = 0 }: NoTradesStateProps) => {
  const hasSkippedSignals = skippedSignals > 0;

  return (
    <Card className="border-warning/30 bg-warning/5">
      <CardContent className="py-10 text-center space-y-4">
        <div className="h-14 w-14 rounded-full bg-warning/10 flex items-center justify-center mx-auto">
          {hasSkippedSignals ? (
            <IndianRupee className="h-7 w-7 text-warning" />
          ) : (
            <AlertCircle className="h-7 w-7 text-warning" />
          )}
        </div>
        <div>
          <h3 className="font-heading font-semibold text-lg">
            {hasSkippedSignals ? "Signals Generated — Insufficient Capital" : "No Trades Generated"}
          </h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            {hasSkippedSignals ? (
              <>
                Your strategy triggered <strong>{skippedSignals} signal{skippedSignals > 1 ? 's' : ''}</strong>, 
                but the capital was too low to open any position. Try increasing your initial capital or reducing position sizing percentage.
              </>
            ) : (
              "Your strategy didn't trigger any trades during this period. This can happen when:"
            )}
          </p>
        </div>
        {!hasSkippedSignals && (
          <ul className="text-sm text-muted-foreground space-y-1 max-w-sm mx-auto text-left">
            <li className="flex items-start gap-2">
              <span className="text-warning mt-0.5">•</span>
              Entry conditions were never met in the dataset
            </li>
            <li className="flex items-start gap-2">
              <span className="text-warning mt-0.5">•</span>
              The dataset is too short for the strategy's logic
            </li>
            <li className="flex items-start gap-2">
              <span className="text-warning mt-0.5">•</span>
              There's a timeframe mismatch with the strategy rules
            </li>
          </ul>
        )}
        <Button onClick={onModifyStrategy} variant="outline" className="mt-2">
          <Pencil className="h-4 w-4 mr-2" />
          {hasSkippedSignals ? "Adjust Settings" : "Modify Strategy"}
        </Button>
      </CardContent>
    </Card>
  );
};
