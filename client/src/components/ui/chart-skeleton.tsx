/**
 * Chart Skeleton Components
 * Provides skeleton loaders for different chart types
 */

import { Skeleton } from "./skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";

interface ChartSkeletonProps {
  title?: string;
  description?: string;
  height?: number;
  showLegend?: boolean;
}

export function LineChartSkeleton({ 
  title = "Loading Chart...", 
  description,
  height = 250,
  showLegend = false 
}: ChartSkeletonProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {showLegend && (
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          )}
          <div className="relative" style={{ height }}>
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-3 w-8" />
              ))}
            </div>
            
            {/* Chart area */}
            <div className="ml-12 mr-4 h-full relative">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-px bg-border opacity-30" />
                ))}
              </div>
              
              {/* Chart line simulation */}
              <div className="absolute inset-0 flex items-center">
                <svg className="w-full h-full opacity-30">
                  <path
                    d="M 0 80 Q 25 60 50 70 T 100 50 T 150 60 T 200 40 T 250 50 T 300 30"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    className="text-emerald-400"
                  />
                </svg>
              </div>
            </div>
            
            {/* X-axis labels */}
            <div className="absolute bottom-0 left-12 right-4 flex justify-between pt-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-3 w-12" />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AreaChartSkeleton({ 
  title = "Loading Chart...", 
  description,
  height = 250 
}: ChartSkeletonProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="relative" style={{ height }}>
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-3 w-8" />
            ))}
          </div>
          
          {/* Chart area */}
          <div className="ml-12 mr-4 h-full relative">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-px bg-border opacity-30" />
              ))}
            </div>
            
            {/* Area chart simulation */}
            <div className="absolute inset-0 flex items-end">
              <div className="w-full h-3/4 bg-gradient-to-t from-emerald-500/20 to-emerald-500/5 rounded-t-lg opacity-50" />
            </div>
          </div>
          
          {/* X-axis labels */}
          <div className="absolute bottom-0 left-12 right-4 flex justify-between pt-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-3 w-12" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function BarChartSkeleton({ 
  title = "Loading Chart...", 
  description,
  height = 250 
}: ChartSkeletonProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="relative" style={{ height }}>
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-3 w-8" />
            ))}
          </div>
          
          {/* Chart area */}
          <div className="ml-12 mr-4 h-full relative flex items-end justify-between pb-8">
            {[...Array(8)].map((_, i) => (
              <Skeleton 
                key={i} 
                className="w-8" 
                style={{ height: `${Math.random() * 60 + 20}%` }}
              />
            ))}
          </div>
          
          {/* X-axis labels */}
          <div className="absolute bottom-0 left-12 right-4 flex justify-between pt-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-3 w-8" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PieChartSkeleton({ 
  title = "Loading Chart...", 
  description,
  height = 250 
}: ChartSkeletonProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="relative">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Skeleton className="h-16 w-16 rounded-full" />
            </div>
          </div>
          <div className="ml-8 space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}