import TopBar from '../TopBar';
import Card from '../Card';
import Button from '../Button';
import ErrorMessage from '../ErrorMessage';
import PipelineBoard from './PipelineBoard';
import ApplicationInspectorPanel from './ApplicationInspectorPanel';
import type { PipelinePageState } from '../../hooks/usePipelinePage';

export default function PipelineDesktopView({
  t,
  locale,
  jobsError,
  setSelectedJobId,
  jobOptions,
  jobSelectValue,
  nameQuery,
  setNameQuery,
  jobsLoading,
  data,
  columns,
  isLoading,
  toastError,
  toastSuccess,
  setIsCreateOpen,
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
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <div className="w-full sm:w-72">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('pipeline.selectJob')}</label>
                <select
                  className="w-full px-4 py-3 bg-white/80 backdrop-blur border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  value={jobSelectValue}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  disabled={jobsLoading}
                >
                  {jobOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative w-full sm:w-72">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder={t('pipeline.searchPlaceholder')}
                  value={nameQuery}
                  onChange={(e) => setNameQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
              </div>
              {jobsError ? (
                <div className="w-full">
                  <ErrorMessage message={jobsError.message || 'Failed to load jobs'} />
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="primary" size="md" onClick={() => setIsCreateOpen(true)} disabled={jobsLoading}>
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

        {/* Main area: board + inspector */}
        <div
          className={`grid grid-cols-1 gap-6 lg:items-stretch ${
            inspectorOpen ? (layoutCollapsed ? 'lg:grid-cols-[1fr_96px]' : 'lg:grid-cols-[1fr_420px]') : 'lg:grid-cols-1'
          }`}
        >
          <Card className="flex min-h-0 flex-col overflow-hidden p-0 lg:h-[calc(100vh-140px)]">
            {isLoading ? (
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
