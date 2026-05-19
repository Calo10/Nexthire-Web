import type { ApplicationsByStage } from '../types/dashboard';

interface BarChartProps {
  data: ApplicationsByStage[];
  isLoading?: boolean;
}

export default function BarChart({ data, isLoading }: BarChartProps) {
  // Debug logging (dev only)
  if (import.meta.env.DEV) {
    console.log('[BarChart] Props:', { data, isLoading, dataLength: data?.length || 0 });
  }

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <p>No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.count), 1);
  
  // Map stage names to colors (case-insensitive)
  const getStageColor = (stageName: string): string => {
    const normalized = stageName.toLowerCase();
    if (normalized.includes('screen')) return '#3B82F6'; // Blue
    if (normalized.includes('applied')) return '#8B5CF6'; // Purple
    if (normalized.includes('interview')) return '#F97316'; // Orange
    if (normalized.includes('offer')) return '#F59E0B'; // Amber
    if (normalized.includes('hired')) return '#10B981'; // Green
    return '#6B7280'; // Default gray
  };

  const chartHeight = 200;
  const chartWidth = 600; // Fixed width for calculations
  const padding = 40;
  const availableWidth = chartWidth - (padding * 2);
  const barSpacing = availableWidth / data.length;
  const barWidth = barSpacing * 0.7;

  return (
    <div className="w-full">
      <div className="relative" style={{ height: `${chartHeight + 60}px` }}>
        <svg width="100%" height={chartHeight + 60} viewBox={`0 0 ${chartWidth} ${chartHeight + 60}`} className="overflow-visible">
          {/* Y-axis labels */}
          <g>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const value = Math.round(maxValue * ratio);
              const y = chartHeight - (chartHeight * ratio);
              return (
                <g key={`y-axis-${ratio}`}>
                  <line
                    x1={padding}
                    y1={y + 30}
                    x2={chartWidth - padding}
                    y2={y + 30}
                    stroke="#E5E7EB"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padding - 10}
                    y={y + 30 + 4}
                    className="text-xs text-gray-500"
                    fill="currentColor"
                    textAnchor="end"
                  >
                    {value}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Bars */}
          <g transform={`translate(${padding}, 30)`}>
            {data.map((item, index) => {
              const barHeight = (item.count / maxValue) * chartHeight;
              const x = index * barSpacing;
              const y = chartHeight - barHeight;
              const color = getStageColor(item.stageName);

              return (
                <g key={`bar-${item.stageId}-${index}`}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={color}
                    rx="4"
                    className="hover:opacity-80 transition-opacity"
                  />
                  <text
                    x={x + barWidth / 2}
                    y={y - 5}
                    textAnchor="middle"
                    className="text-xs font-medium text-gray-700"
                    fill="currentColor"
                  >
                    {item.count}
                  </text>
                </g>
              );
            })}
          </g>

          {/* X-axis labels */}
          <g transform={`translate(${padding}, ${chartHeight + 30})`}>
            {data.map((item, index) => {
              const x = index * barSpacing + barWidth / 2;
              return (
                <text
                  key={`label-${item.stageId}-${index}`}
                  x={x}
                  y="20"
                  textAnchor="middle"
                  className="text-xs text-gray-600"
                  fill="currentColor"
                >
                  {item.stageName}
                </text>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
