import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Rule } from "./RuleBuilder";

interface AIStrategyGeneratorProps {
  onGenerate: (data: {
    name: string;
    description: string;
    entryRules: Rule[];
    exitRules: Rule[];
  }) => void;
}

export const AIStrategyGenerator = ({ onGenerate }: AIStrategyGeneratorProps) => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please describe your trading strategy idea");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-strategy", {
        body: { prompt: prompt.trim() },
      });

      if (error) {
        throw new Error(error.message || "Failed to generate strategy");
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.name || !data.entryRules || !data.exitRules) {
        throw new Error("Invalid strategy response");
      }

      onGenerate({
        name: data.name,
        description: data.description || "",
        entryRules: data.entryRules,
        exitRules: data.exitRules,
      });

      toast.success("Strategy generated! Review and customize the rules below.");
      setPrompt("");
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(error.message || "Failed to generate strategy");
    } finally {
      setIsGenerating(false);
    }
  };

  const examplePrompts = [
    "Buy when RSI is oversold and price crosses above 20-day SMA",
    "Golden cross strategy with volume confirmation",
    "Mean reversion using Bollinger Bands",
  ];

  return (
    <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-accent/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          AI Strategy Generator
        </CardTitle>
        <CardDescription>
          Describe your trading idea in plain English and let AI create the rules
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Example: Create a momentum strategy that buys when RSI crosses above 30 from oversold territory and the price is above the 50-day moving average. Exit when RSI goes above 70 or price drops below the moving average."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          className="resize-none"
          disabled={isGenerating}
          maxLength={2000}
        />
        <p className="text-xs text-muted-foreground text-right">{prompt.length}/2000</p>
        
        <div className="flex flex-wrap gap-2">
          {examplePrompts.map((example, i) => (
            <button
              key={i}
              onClick={() => setPrompt(example)}
              disabled={isGenerating}
              className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors disabled:opacity-50"
            >
              {example}
            </button>
          ))}
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Strategy...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Generate Strategy
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
