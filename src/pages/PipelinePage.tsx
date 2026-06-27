import { usePipelinePage } from '../hooks/usePipelinePage';
import PipelineDesktopView from '../components/pipeline/PipelineDesktopView';
import PipelineMobileView from '../components/pipeline/PipelineMobileView';
import Button from '../components/Button';
import ErrorMessage from '../components/ErrorMessage';
import Modal from '../components/Modal';
import TextareaField from '../components/TextareaField';
import TextField from '../components/TextField';
import CreateApplicationModal from '../components/pipeline/CreateApplicationModal';
import HoverTooltip from '../components/HoverTooltip';

export default function PipelinePage() {
  const page = usePipelinePage();
  const whatsappChannelDisabled = page.twilioLoading || !page.twilioReady;
  const showWhatsappChannelTooltip = !page.twilioReady && !page.twilioLoading;

  const whatsappChannelTooltip = (
    <>
      {page.t('pipeline.message.whatsappConfigureRequired')}{' '}
      <button
        type="button"
        className="font-medium text-violet-300 underline hover:text-white"
        onClick={page.goToSourcingSources}
      >
        {page.t('sourcing.twilio.goToSources')}
      </button>
    </>
  );

  return (
    <>
      <div className="hidden lg:block">
        <PipelineDesktopView {...page} />
      </div>
      <div className="lg:hidden">
        <PipelineMobileView {...page} />
      </div>

      <Modal
        isOpen={page.isAddNoteOpen}
        onClose={() => {
          page.setIsAddNoteOpen(false);
          page.setNoteError(null);
        }}
        title={page.t('pipeline.inspector.addNote.title')}
        subtitle={page.t('pipeline.inspector.addNote.subtitle')}
        width="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => page.setIsAddNoteOpen(false)} disabled={page.noteSubmitting}>
              {page.t('common.actions.cancel')}
            </Button>
            <Button variant="primary" onClick={page.handleCreateNote} disabled={page.noteSubmitting}>
              {page.noteSubmitting ? page.t('common.actions.saving') : page.t('pipeline.inspector.addNote.save')}
            </Button>
          </>
        }
      >
        {page.noteError ? <ErrorMessage message={page.noteError} /> : null}
        <TextareaField
          label={page.t('pipeline.inspector.addNote.body')}
          value={page.noteBody}
          onChange={(e) => page.setNoteBody(e.target.value)}
          placeholder={page.t('pipeline.inspector.addNote.placeholder')}
        />
      </Modal>

      <Modal
        isOpen={page.isSendMessageOpen}
        onClose={() => {
          page.setIsSendMessageOpen(false);
          page.setSendMessageForId(null);
          page.setMessageError(null);
        }}
        title={page.t('pipeline.message.title')}
        subtitle={page.t('pipeline.message.subtitle')}
        width="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                page.setIsSendMessageOpen(false);
                page.setMessageError(null);
              }}
              disabled={page.messageSubmitting}
            >
              {page.t('common.actions.cancel')}
            </Button>
            <Button variant="primary" onClick={page.handleSendMessage} disabled={!page.canSendMessage}>
              {page.messageSubmitting ? page.t('pipeline.message.sending') : page.t('pipeline.message.send')}
            </Button>
          </>
        }
      >
        {page.messageError ? <ErrorMessage message={page.messageError} /> : null}
        {page.sendMessageForId ? (
          <div className="mb-4 rounded-2xl border border-gray-200 bg-white/70 backdrop-blur p-4">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{page.t('pipeline.message.context')}</p>
            <div className="mt-2 text-sm text-gray-800">
              <span className="font-semibold">{page.sendMessageCard?.candidateName || '—'}</span>
              {page.sendMessageCard?.jobTitle ? (
                <span className="text-gray-500"> • {page.sendMessageCard.jobTitle}</span>
              ) : null}
              {page.recipientEmailLoading ? (
                <div className="text-xs text-gray-500 mt-0.5">{page.t('common.loading')}</div>
              ) : null}
              {!page.recipientEmailLoading && page.messageChannel === 'email' && page.recipientEmail ? (
                <div className="text-xs text-gray-500 mt-0.5">{page.recipientEmail}</div>
              ) : null}
              {!page.recipientEmailLoading && page.messageChannel === 'whatsapp' && page.recipientPhone ? (
                <div className="text-xs text-gray-500 mt-0.5">{page.recipientPhone}</div>
              ) : null}
            </div>
          </div>
        ) : null}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">{page.t('pipeline.message.template')}</label>
            <select
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              value={page.selectedTemplateId}
              onChange={(e) => page.setSelectedTemplateId(e.target.value)}
              disabled={page.templatesLoading}
            >
              {!page.templatesLoading && page.templates.length === 0 ? (
                <option value="">{page.t('pipeline.message.noTemplates')}</option>
              ) : (
                page.templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </option>
                ))
              )}
            </select>
            {page.selectedTemplateLoading ? (
              <div className="mt-2 text-xs text-gray-500">{page.t('common.loading')}</div>
            ) : page.selectedTemplateError ? (
              <div className="mt-2 text-xs text-red-600">{page.t('pipeline.message.templateLoadFailed')}</div>
            ) : null}
          </div>

          <div className="shrink-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">{page.t('pipeline.message.channel')}</label>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => page.setMessageChannel('email')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  page.messageChannel === 'email' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-dark-text'
                }`}
              >
                Email
              </button>
              <HoverTooltip show={showWhatsappChannelTooltip} content={whatsappChannelTooltip} align="end">
                <button
                  type="button"
                  onClick={() => page.setMessageChannel('whatsapp')}
                  disabled={whatsappChannelDisabled}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-45 disabled:cursor-not-allowed ${
                    page.messageChannel === 'whatsapp' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-dark-text'
                  } ${whatsappChannelDisabled ? 'pointer-events-none' : ''}`}
                >
                  WhatsApp
                </button>
              </HoverTooltip>
            </div>
          </div>
        </div>

        {page.messageChannel === 'email' ? (
          <div className="mb-5">
            <TextField
              label={page.t('pipeline.message.subject')}
              value={page.messageSubject}
              onFocus={() => page.setMessageSubjectTouched(true)}
              onChange={(e) => {
                page.setMessageSubjectTouched(true);
                page.setMessageSubject(e.target.value);
              }}
            />
          </div>
        ) : null}

        <TextareaField
          label={page.t('pipeline.message.body')}
          value={page.messageBody}
          onFocus={() => page.setMessageBodyTouched(true)}
          onChange={(e) => {
            page.setMessageBodyTouched(true);
            page.setMessageBody(e.target.value);
          }}
          placeholder={page.t('pipeline.message.placeholder')}
        />
      </Modal>

      <CreateApplicationModal
        isOpen={page.isCreateOpen}
        jobs={page.jobs || []}
        job={page.selectedJob}
        onClose={() => page.setIsCreateOpen(false)}
        onCreated={(card) => {
          const createdJobId = String(card.jobId || '');
          if (createdJobId && createdJobId !== String(page.selectedJobId)) {
            page.setSelectedJobId(createdJobId);
            setTimeout(() => page.refetch(), 300);
            return;
          }

          page.insertIntoFirstStage({
            ...card,
            jobTitle: card.jobTitle || page.selectedJob?.title || '',
            stageId: card.stageId || page.columns[0]?.stageId || '',
            createdAt: card.createdAt || new Date().toISOString(),
          });
          setTimeout(() => page.refetch(), 300);
        }}
      />
    </>
  );
}
