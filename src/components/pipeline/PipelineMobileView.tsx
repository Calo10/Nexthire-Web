import Button from '../Button';
import ErrorMessage from '../ErrorMessage';
import type { KanbanColumn, KanbanStage } from '../../types/applications';
import PipelineMobileBoard from './PipelineMobileBoard';
import ApplicationInspectorPanel from './ApplicationInspectorPanel';
import type { PipelinePageState } from '../../hooks/usePipelinePage';

function MobileStageCounts({ stages, columns }: { stages: KanbanStage[]; columns: KanbanColumn[] }) {
  if (!stages?.length) return null;

  const countByStage = new Map(columns.map((c) => [c.stageId, c.items.length]));

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 mb-4">
      {stages.map((s) => (
        <div
          key={s.id}
          className="shrink-0 rounded-xl border border-gray-200 bg-white px-3 py-2 min-w-[88px]"
        >
          <p className="text-[10px] text-gray-500 truncate max-w-[120px]">{s.name}</p>
          <p className="text-lg font-bold text-dark-text">{countByStage.get(s.id) || 0}</p>
        </div>
      ))}
    </div>
  );
}

export default function PipelineMobileView({
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
  inspectorLoading,
  historyRefreshKey,
}: PipelinePageState) {
  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <div className="p-4">
        <h1 className="text-lg font-semibold text-dark-text mb-3">{t('pipeline.title')}</h1>

        <label className="block text-xs font-medium text-gray-500 mb-1.5">{t('pipeline.selectJob')}</label>
        <select
          className="w-full px-3 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm mb-3"
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
          <div className="mb-3">
            <ErrorMessage message={jobsError.message || 'Failed to load jobs'} />
          </div>
        ) : null}

        <Button
          variant="primary"
          size="md"
          className="w-full justify-center mb-4"
          onClick={() => setIsCreateOpen(true)}
          disabled={!selectedJob}
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

        {selectedJobId && data?.stages?.length ? (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 mb-2">{t('pipeline.overview')}</p>
            <MobileStageCounts stages={data.stages} columns={columns} />
          </div>
        ) : null}

        {!selectedJobId ? (
          <div className="text-center py-12 text-sm text-gray-600 bg-white rounded-xl border border-gray-200">
            {t('pipeline.selectJob')}
          </div>
        ) : isLoading ? (
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
