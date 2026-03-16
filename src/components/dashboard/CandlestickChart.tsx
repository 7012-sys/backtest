import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CandlestickChartProps {
  data: CandleData[];
  loading?: boolean;
  symbol?: string;
}

export const CandlestickChart = ({ data, loading, symbol = "NIFTY 50" }: CandlestickChartProps) => {
  if (loading) {
    return (
      <Card className="border-border shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            {symbol} Price Action
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading chart...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="border-border shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            {symbol} Price Action
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No price data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const minLow = Math.min(...data.map(d => d.low));
  const maxHigh = Math.max(...data.map(d => d.high));
  const padding = (maxHigh - minLow) * 0.1;
  const minPrice = minLow - padding;
  const maxPrice = maxHigh + padding;
  const priceRange = maxPrice - minPrice;

  // Generate Y-axis ticks
  const yTicks = [];
  const tickCount = 5;
  for (let i = 0; i <= tickCount; i++) {
    yTicks.push(minPrice + (priceRange * i) / tickCount);
  }

  const chartHeight = 220;
  const chartWidth = 100; // percentage

  const getY = (price: number) => {
    return ((maxPrice - price) / priceRange) * chartHeight;
  };

  return (
    <Card className="border-border shadow-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            {symbol} Price Action
          </CardTitle>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" />
              Bullish
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-red-500" />
              Bearish
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex h-[280px]">
          {/* Y-axis labels */}
          <div className="flex flex-col justify-between text-xs text-muted-foreground pr-2 py-2" style={{ height: chartHeight }}>
            {yTicks.reverse().map((tick, i) => (
              <span key={i} className="text-right min-w-[45px]">{tick.toFixed(0)}</span>
            ))}
          </div>
          
          {/* Chart area */}
          <div className="flex-1 relative">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ height: chartHeight }}>
              {yTicks.map((_, i) => (
                <div key={i} className="border-t border-border/30 w-full" />
              ))}
            </div>
            
            {/* Candlesticks container */}
            <svg width="100%" height={chartHeight} className="overflow-visible">
              {data.map((candle, index) => {
                const isGreen = candle.close >= candle.open;
                const color = isGreen ? "#10b981" : "#ef4444";
                
                const candleWidth = Math.max(100 / data.length * 0.6, 0.8);
                const x = (index / data.length) * 100 + (100 / data.length) / 2;
                
                const highY = getY(candle.high);
                const lowY = getY(candle.low);
                const openY = getY(candle.open);
                const closeY = getY(candle.close);
                
                const bodyTop = Math.min(openY, closeY);
                const bodyHeight = Math.max(Math.abs(closeY - openY), 2);
                
                return (
                  <g key={index} className="cursor-pointer group">
                    {/* Hover area for tooltip */}
                    <rect
                      x={`${x - candleWidth}%`}
                      y={0}
                      width={`${candleWidth * 2}%`}
                      height={chartHeight}
                      fill="transparent"
                    />
                    {/* Upper wick */}
                    <line
                      x1={`${x}%`}
                      y1={highY}
                      x2={`${x}%`}
                      y2={bodyTop}
                      stroke={color}
                      strokeWidth={1.5}
                    />
                    {/* Lower wick */}
                    <line
                      x1={`${x}%`}
                      y1={bodyTop + bodyHeight}
                      x2={`${x}%`}
                      y2={lowY}
                      stroke={color}
                      strokeWidth={1.5}
                    />
                    {/* Body */}
                    <rect
                      x={`${x - candleWidth / 2}%`}
                      y={bodyTop}
                      width={`${candleWidth}%`}
                      height={bodyHeight}
                      fill={color}
                      stroke={color}
                      strokeWidth={1}
                      rx={1}
                      className="transition-opacity group-hover:opacity-80"
                    />
                    {/* Tooltip on hover */}
                    <title>
                      {`${candle.date}\nOpen: ${candle.open.toFixed(2)}\nHigh: ${candle.high.toFixed(2)}\nLow: ${candle.low.toFixed(2)}\nClose: ${candle.close.toFixed(2)}`}
                    </title>
                  </g>
                );
              })}
            </svg>
            
            {/* X-axis labels */}
            <div className="flex justify-between text-xs text-muted-foreground pt-2 px-1">
              {data.filter((_, i) => i % Math.ceil(data.length / 5) === 0 || i === data.length - 1).map((candle, i) => (
                <span key={i}>{candle.date}</span>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
