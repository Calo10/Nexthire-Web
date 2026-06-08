export default function LandingAiVisual() {
  return (
    <div className="rounded-2xl border border-purple-200/60 bg-white/95 backdrop-blur p-5 shadow-xl shadow-purple-900/10 space-y-4">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-700 text-white">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z"
            />
          </svg>
        </span>
        <div>
          <p className="text-sm font-semibold text-dark-text">AI Agent · Screening</p>
          <p className="text-[11px] text-gray-500">Running for Backend Engineer</p>
        </div>
        <span className="ml-auto text-[10px] font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full animate-pulse">
          AI active
        </span>
      </div>

      <div className="rounded-xl bg-purple-50/80 border border-purple-100 p-4 space-y-3">
        {[
          { step: 'Sourcing', status: 'Processed 42 leads', done: true },
          { step: 'Screening', status: 'Drafting personalized outreach', done: true },
          { step: 'Interview', status: 'Scheduling top 5 candidates', done: false },
          { step: 'Offer', status: 'Waiting for screening completion', done: false },
        ].map((item) => (
          <div key={item.step} className="flex items-center gap-3">
            <span
              className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                item.done ? 'bg-primary shadow-[0_0_8px_rgba(139,92,246,0.6)]' : 'bg-gray-300'
              }`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-dark-text">{item.step}</p>
              <p className="text-[10px] text-gray-500 truncate">{item.status}</p>
            </div>
            {item.done && (
              <span className="text-[10px] font-medium text-primary">AI</span>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
        <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Suggested message</p>
        <p className="text-xs text-gray-700 leading-relaxed">
          Hi Alex — your backend experience looks like a strong match for our open role. Would you be open to a 20-minute intro call this week?
        </p>
      </div>
    </div>
  );
}
