import TopBar from '../TopBar';
import Card from '../Card';
import Button from '../Button';
import ErrorMessage from '../ErrorMessage';
import PipelineSummaryTiles from './PipelineSummaryTiles';
import PipelineBoard from './PipelineBoard';
import ApplicationInspectorPanel from './ApplicationInspectorPanel';
import type { PipelinePageState } from '../../hooks/usePipelinePage';

export default function PipelineDesktopView({
  t,
  locale,
  jobsError,
  selectedJobId,
  setSelectedJobId,
  selectedJob,
  jobOptions,
  jobsLoading,
  data,
  columns,
  isLoading,
  toastError,
  toastSuccess,
  setIsCreateOpen,
  isOverviewCollapsed,
  setIsOverviewCollapsed,
  inspectorOpen,
  layoutCollapsed,
  selectedApplicationId,
  selectedCard,
  isEmpty,
  openInspectorFor,
  closeInspector,
  handleMove,
  handleUpdateApplicationStatus,
  openAddNote,
  openSendMessageFor,
  pipelineTenantId,
  handleUnauthorized,
  twilioReady,
  twilioLoading,
  goToSourcingSources,
  inspectorLoading,
  setIsInspectorCollapsed,
  historyRefreshKey,
}: PipelinePageState) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <TopBar />

      <div className="p-8">
        {/* Header v2 */}
        <div className="flex items-start justify-between gap-6 mb-6">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-dark-text">{t('pipeline.title')}</h1>
            <div className="mt-3 w-full max-w-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('pipeline.selectJob')}</label>
              <select
                className="w-full px-4 py-3 bg-white/80 backdrop-blur border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                disabled={jobsLoading}
              >
                {jobOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {jobsError ? (
                <div className="mt-2">
                  <ErrorMessage message={jobsError.message || 'Failed to load jobs'} />
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="primary" size="md" onClick={() => setIsCreateOpen(true)} disabled={!selectedJob}>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>{t('pipeline.addApplication')}</span>
              </div>
            </Button>
          </div>
        </div>

        {toastError ? (
          <div className="mb-6">
            <ErrorMessage message={toastError} />
          </div>
        ) : null}
        {toastSuccess ? (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{toastSuccess}</div>
        ) : null}

        {/* Overview panel (collapsible) */}
        {selectedJobId && data?.stages?.length ? (
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white/60 backdrop-blur-md shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary/70" />
                <p className="text-sm font-semibold text-dark-text">{t('pipeline.overview')}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOverviewCollapsed((v) => !v)}
                className="p-2 rounded-lg hover:bg-white/70 text-gray-600 transition-colors"
                aria-label={isOverviewCollapsed ? 'Expand overview' : 'Collapse overview'}
              >
                <svg
                  className={`w-5 h-5 transition-transform ${isOverviewCollapsed ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <div className="px-5 pb-5">
              {!isOverviewCollapsed ? <PipelineSummaryTiles stages={data.stages} columns={columns} /> : null}
            </div>
          </div>
        ) : null}

        {/* Main area: board + inspector */}
        <div
          className={`grid grid-cols-1 gap-6 lg:items-stretch ${
            inspectorOpen ? (layoutCollapsed ? 'lg:grid-cols-[1fr_96px]' : 'lg:grid-cols-[1fr_420px]') : 'lg:grid-cols-1'
          }`}
        >
          <Card className="flex min-h-0 flex-col overflow-hidden p-0 lg:h-[calc(100vh-140px)]">
            {!selectedJobId ? (
              <div className="p-10 text-center text-sm text-gray-600">{t('pipeline.selectJob')}</div>
            ) : isLoading ? (
              <div className="p-6">
                <div className="flex gap-6 overflow-x-auto scrollbar-subtle scrollbar-subtle-x pb-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-[320px] shrink-0 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 min-h-[560px]">
                      <div className="h-6 bg-gray-200 rounded w-2/3 animate-pulse mb-4" />
                      <div className="space-y-3">
                        {[1, 2, 3].map((j) => (
                          <div key={j} className="h-28 bg-gray-200 rounded-2xl animate-pulse" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : isEmpty ? (
              <div className="p-12 text-center">
                <h3 className="text-xl font-semibold text-dark-text mb-2">{t('pipeline.empty.title')}</h3>
                <p className="text-sm text-gray-600 mb-6">{t('pipeline.empty.subtitle')}</p>
                <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
                  {t('pipeline.addApplication')}
                </Button>
              </div>
            ) : (
              <PipelineBoard
                columns={columns}
                locale={locale}
                selectedApplicationId={selectedApplicationId}
                onSelectCard={openInspectorFor}
                onMove={handleMove}
                onCardAddNote={(id) => openAddNote(id)}
                onCardSendMessage={(id) => openSendMessageFor(id)}
              />
            )}
          </Card>

          {inspectorOpen ? (
            <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-140px)] overflow-hidden">
              <ApplicationInspectorPanel
                isOpen={inspectorOpen}
                isLoading={inspectorLoading}
                collapsed={layoutCollapsed}
                application={selectedCard}
                tenantId={pipelineTenantId}
                twilioReady={twilioReady}
                twilioLoading={twilioLoading}
                onGoToSources={goToSourcingSources}
                stages={data?.stages || []}
                locale={locale}
                historyRefreshKey={historyRefreshKey}
                onClose={closeInspector}
                onToggleCollapsed={() => setIsInspectorCollapsed((v) => !v)}
                onReject={() => {
                  if (!selectedCard?.id) return Promise.resolve();
                  const raw = String(selectedCard.status || '').toLowerCase();
                  const isRejected = raw.includes('reject');
                  return handleUpdateApplicationStatus(selectedCard.id, isRejected ? 'active' : 'rejected');
                }}
                onArchive={() => {
                  if (!selectedCard?.id) return Promise.resolve();
                  return handleUpdateApplicationStatus(selectedCard.id, 'archived');
                }}
                onUnauthorized={handleUnauthorized}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
