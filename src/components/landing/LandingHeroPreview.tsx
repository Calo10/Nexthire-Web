export default function LandingHeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/20 to-purple-300/30 blur-2xl" aria-hidden="true" />
      <div className="relative rounded-2xl border border-white/60 bg-white/90 backdrop-blur shadow-2xl shadow-purple-500/10 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/80 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
          <span className="ml-3 text-xs text-gray-500 font-medium">NextHire · Dashboard</span>
          <span className="ml-auto text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
            </svg>
            AI
          </span>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Active Jobs', value: '12', tone: 'text-primary' },
              { label: 'In Pipeline', value: '48', tone: 'text-purple-600' },
              { label: 'Interviews', value: '6', tone: 'text-indigo-600' },
              { label: 'Hired', value: '3', tone: 'text-emerald-600' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-gray-100 bg-white p-3">
                <p className={`text-xl font-bold ${stat.tone}`}>{stat.value}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-dark-text">Pipeline</p>
              <span className="text-[10px] text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">Live</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { stage: 'Applied', count: 18, color: 'bg-blue-100 text-blue-700' },
                { stage: 'Screen', count: 11, color: 'bg-amber-100 text-amber-700' },
                { stage: 'Interview', count: 6, color: 'bg-purple-100 text-purple-700' },
                { stage: 'Offer', count: 2, color: 'bg-emerald-100 text-emerald-700' },
              ].map((col) => (
                <div key={col.stage} className="rounded-lg bg-white border border-gray-100 p-2 min-h-[72px]">
                  <p className="text-[10px] font-medium text-gray-500 mb-1">{col.stage}</p>
                  <span className={`inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded ${col.color}`}>
                    {col.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {[
              { name: 'Maria Lopez', role: 'Product Designer', stage: 'Interview' },
              { name: 'James Chen', role: 'Backend Engineer', stage: 'Screening' },
            ].map((candidate) => (
              <div
                key={candidate.name}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-purple-700 text-white text-[10px] font-bold flex items-center justify-center">
                    {candidate.name.split(' ').map((part) => part[0]).join('')}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-dark-text">{candidate.name}</p>
                    <p className="text-[10px] text-gray-500">{candidate.role}</p>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {candidate.stage}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
