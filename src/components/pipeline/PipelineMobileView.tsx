import Button from '../Button';
import ErrorMessage from '../ErrorMessage';
import PipelineMobileBoard from './PipelineMobileBoard';
import ApplicationInspectorPanel from './ApplicationInspectorPanel';
import type { PipelinePageState } from '../../hooks/usePipelinePage';

export default function PipelineMobileView({
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
  isEmpty,
  selectedApplicationId,
  inspectorOpen,
  selectedCard,
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
  historyRefreshKey,
}: PipelinePageState) {
  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <div className="p-4">
        <h1 className="text-lg font-semibold text-dark-text mb-3">{t('pipeline.title')}</h1>

        <div className="grid grid-cols-1 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">{t('pipeline.selectJob')}</label>
            <select
              className="w-full px-3 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
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
          <div className="relative">
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
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>
        </div>
        {jobsError ? (
          <div className="mb-3">
            <ErrorMessage message={jobsError.message || 'Failed to load jobs'} />
          </div>
        ) : null}

        <Button
          variant="primary"
          size="md"
          className="w-full justify-center mb-4"
          onClick={() => setIsCreateOpen(true)}
          disabled={jobsLoading}
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>{t('pipeline.addApplication')}</span>
          </div>
        </Button>

        {toastError ? (
          <div className="mb-4">
            <ErrorMessage message={toastError} />
          </div>
        ) : null}
        {toastSuccess ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {toastSuccess}
          </div>
        ) : null}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-white rounded-xl border border-gray-200 animate-pulse" />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="text-center py-12 px-4 bg-white rounded-xl border border-gray-200">
            <h3 className="text-base font-semibold text-dark-text mb-2">{t('pipeline.empty.title')}</h3>
            <p className="text-sm text-gray-600 mb-4">{t('pipeline.empty.subtitle')}</p>
            <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
              {t('pipeline.addApplication')}
            </Button>
          </div>
        ) : data?.stages?.length ? (
          <PipelineMobileBoard
            stages={data.stages}
            columns={columns}
            locale={locale}
            selectedApplicationId={selectedApplicationId}
            onSelectCard={openInspectorFor}
            onMove={handleMove}
            onCardAddNote={(id) => openAddNote(id)}
            onCardSendMessage={(id) => openSendMessageFor(id)}
          />
        ) : null}
      </div>

      {inspectorOpen ? (
        <ApplicationInspectorPanel
          isOpen={inspectorOpen}
          isLoading={inspectorLoading}
          collapsed={false}
          application={selectedCard}
          tenantId={pipelineTenantId}
          twilioReady={twilioReady}
          twilioLoading={twilioLoading}
          onGoToSources={goToSourcingSources}
          stages={data?.stages || []}
          locale={locale}
          historyRefreshKey={historyRefreshKey}
          onClose={closeInspector}
          onToggleCollapsed={() => undefined}
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
      ) : null}
    </div>
  );
}
