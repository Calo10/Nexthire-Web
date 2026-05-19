import type { ActivityTrend } from '../types/dashboard';

interface LineChartProps {
  data: ActivityTrend[];
  isLoading?: boolean;
}

export default function LineChart({ data, isLoading }: LineChartProps) {
  // Debug logging (dev only)
  if (import.meta.env.DEV) {
    console.log('[LineChart] Props:', { data, isLoading, dataLength: data?.length || 0 });
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

  // Ensure all values are numbers, defaulting to 0 if undefined/null
  const safeData = data.map(d => ({
    ...d,
    applications: Number(d.applications) || 0,
    candidates: Number(d.candidates) || 0,
  }));

  const maxValue = Math.max(
    ...safeData.flatMap(d => [d.applications, d.candidates]),
    1
  );

  const chartHeight = 200;
  const chartWidth = 600; // Fixed width for calculations
  const padding = 40;
  const availableWidth = chartWidth - (padding * 2);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const getPoint = (value: number, index: number, total: number) => {
    const x = total > 1 ? (index / (total - 1)) * availableWidth : availableWidth / 2;
    const normalizedValue = maxValue > 0 ? value / maxValue : 0;
    const y = chartHeight - (normalizedValue * chartHeight);
    return { x: x + padding, y: y + 30 };
  };

  const applicationsPath = safeData
    .map((d, i) => {
      const point = getPoint(d.applications, i, safeData.length);
      return `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
    })
    .join(' ');

  const candidatesPath = safeData
    .map((d, i) => {
      const point = getPoint(d.candidates, i, safeData.length);
      return `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
    })
    .join(' ');

  return (
    <div className="w-full">
      <div className="relative" style={{ height: `${chartHeight + 80}px` }}>
        <svg width="100%" height={chartHeight + 80} viewBox={`0 0 ${chartWidth} ${chartHeight + 80}`} className="overflow-visible">
          {/* Y-axis grid lines */}
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

          {/* Lines */}
          <g>
            <path
              d={applicationsPath}
              fill="none"
              stroke="#8B5CF6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={candidatesPath}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Points */}
            {safeData.map((d, i) => {
              const appPoint = getPoint(d.applications, i, safeData.length);
              const candPoint = getPoint(d.candidates, i, safeData.length);
              return (
                <g key={`points-${i}`}>
                  <circle cx={appPoint.x} cy={appPoint.y} r="4" fill="#8B5CF6" />
                  <circle cx={candPoint.x} cy={candPoint.y} r="4" fill="#3B82F6" />
                </g>
              );
            })}
          </g>

          {/* X-axis labels */}
          <g transform={`translate(${padding}, ${chartHeight + 30})`}>
            {safeData.map((item, index) => {
              const x = safeData.length > 1 
                ? (index / (safeData.length - 1)) * availableWidth 
                : availableWidth / 2;
              return (
                <text
                  key={`label-${index}`}
                  x={x}
                  y="20"
                  textAnchor="middle"
                  className="text-xs text-gray-600"
                  fill="currentColor"
                >
                  {formatDate(item.date)}
                </text>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
          <span className="text-xs text-gray-600">Applications</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-xs text-gray-600">Candidates</span>
        </div>
      </div>
    </div>
  );
}
