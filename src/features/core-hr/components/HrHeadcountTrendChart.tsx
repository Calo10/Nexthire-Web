type Point = { label: string; value: number };

type HrHeadcountTrendChartProps = {
  points: Point[];
};

export default function HrHeadcountTrendChart({ points }: HrHeadcountTrendChartProps) {
  const width = 560;
  const height = 220;
  const padX = 36;
  const padTop = 16;
  const padBottom = 36;
  const chartW = width - padX * 2;
  const chartH = height - padTop - padBottom;
  const min = Math.min(...points.map((p) => p.value));
  const max = Math.max(...points.map((p) => p.value));
  const range = Math.max(max - min, 1);
  const yMin = Math.floor((min - range * 0.15) / 20) * 20;
  const yMax = Math.ceil((max + range * 0.1) / 20) * 20;
  const yRange = Math.max(yMax - yMin, 1);

  const coords = points.map((p, i) => {
    const x = padX + (points.length > 1 ? (i / (points.length - 1)) * chartW : chartW / 2);
    const y = padTop + chartH - ((p.value - yMin) / yRange) * chartH;
    return { x, y, ...p };
  });

  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const area = `${line} L ${coords[coords.length - 1].x} ${padTop + chartH} L ${coords[0].x} ${padTop + chartH} Z`;
  const ticks = [yMin, yMin + yRange / 2, yMax].map((v) => Math.round(v));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[220px]" role="img" aria-hidden>
      <defs>
        <linearGradient id="hrHeadcountFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {ticks.map((tick) => {
        const y = padTop + chartH - ((tick - yMin) / yRange) * chartH;
        return (
          <g key={tick}>
            <line x1={padX} x2={width - padX} y1={y} y2={y} stroke="#EEF0F5" strokeWidth={1} />
            <text x={padX - 8} y={y + 4} textAnchor="end" className="fill-gray-400" fontSize="11">
              {tick}
            </text>
          </g>
        );
      })}
      <path d={area} fill="url(#hrHeadcountFill)" />
      <path d={line} fill="none" stroke="#8B5CF6" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c) => (
        <circle key={c.label} cx={c.x} cy={c.y} r={4} fill="#fff" stroke="#8B5CF6" strokeWidth={2} />
      ))}
      {coords.map((c) => (
        <text
          key={`${c.label}-x`}
          x={c.x}
          y={height - 10}
          textAnchor="middle"
          className="fill-gray-400"
          fontSize="11"
        >
          {c.label}
        </text>
      ))}
    </svg>
  );
}
