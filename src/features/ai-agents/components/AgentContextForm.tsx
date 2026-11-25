import { useTranslation } from 'react-i18next';
import Button from '../../../components/Button';
import SelectField from '../../../components/SelectField';
import TextField from '../../../components/TextField';
import type { AgentContext } from '../api/aiAgentsApi';
import type { AgentId } from '../models/agentCatalog';

type Option = { value: string; label: string };

type Props = {
  agentId: AgentId;
  context: AgentContext;
  jobOptions: Option[];
  stageOptions?: Option[];
  templateOptions?: Option[];
  saving?: boolean;
  onChange: (next: AgentContext) => void;
  onSave: () => void;
};

export default function AgentContextForm({
  agentId,
  context,
  jobOptions,
  stageOptions = [],
  templateOptions = [],
  saving = false,
  onChange,
  onSave,
}: Props) {
  const { t } = useTranslation();

  const cadenceOptions = [
    { value: 'manual', label: t('aiAgents.cadence.manual') },
    { value: 'hourly', label: t('aiAgents.cadence.hourly') },
    { value: 'daily', label: t('aiAgents.cadence.daily') },
    { value: 'weekly', label: t('aiAgents.cadence.weekly') },
  ];

  const channelOptions = [
    { value: 'email', label: t('aiAgents.channel.email') },
    { value: 'whatsapp', label: t('aiAgents.channel.whatsapp') },
  ];

  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-dark-text">{t('aiAgents.detail.contextTitle')}</h2>
        {agentId === 'sourcing' ? (
          <p className="mt-1 text-sm text-gray-500">{t('aiAgents.sourcing.runHint')}</p>
        ) : null}
        {agentId === 'campaign' ? (
          <p className="mt-1 text-sm text-gray-500">{t('aiAgents.campaign.runHint')}</p>
        ) : null}
        {agentId === 'screening' ? (
          <p className="mt-1 text-sm text-gray-500">{t('aiAgents.screening.runHint')}</p>
        ) : null}
        {agentId === 'interview' ? (
          <p className="mt-1 text-sm text-gray-500">{t('aiAgents.interview.runHint')}</p>
        ) : null}
        {agentId === 'offer' ? (
          <p className="mt-1 text-sm text-gray-500">{t('aiAgents.offer.runHint')}</p>
        ) : null}
      </div>

      <SelectField
        label={t('aiAgents.detail.job')}
        value={String(context.jobId || '')}
        onChange={(e) => onChange({ ...context, jobId: e.target.value })}
        options={
          agentId === 'campaign'
            ? jobOptions.filter((option) => option.value)
            : jobOptions
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectField
          label={t('aiAgents.detail.cadence')}
          value={context.cadence || 'daily'}
          onChange={(e) => onChange({ ...context, cadence: e.target.value })}
          options={cadenceOptions}
        />
        {agentId === 'sourcing' ? (
          <TextField
            label={t('aiAgents.sourcing.autoConversionPercent')}
            type="number"
            value={String(context.autoConversionPercent ?? 10)}
            onChange={(e) =>
              onChange({ ...context, autoConversionPercent: Number(e.target.value) || 0 })
            }
          />
        ) : agentId === 'campaign' ? (
          <TextField
            label={t('aiAgents.campaign.dailyBudget')}
            type="number"
            value={String(context.campaignDailyBudget ?? 10)}
            onChange={(e) =>
              onChange({ ...context, campaignDailyBudget: Number(e.target.value) || 0 })
            }
          />
        ) : (
          <SelectField
            label={t('aiAgents.detail.channel')}
            value={context.channel || 'email'}
            onChange={(e) => onChange({ ...context, channel: e.target.value, templateId: '' })}
            options={channelOptions}
          />
        )}
      </div>

      {agentId === 'sourcing' ? (
        <TextField
          label={t('aiAgents.sourcing.maxProcessed')}
          type="number"
          value={String(context.maxProcessed ?? 100)}
          onChange={(e) => onChange({ ...context, maxProcessed: Number(e.target.value) || 0 })}
        />
      ) : agentId === 'campaign' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label={t('aiAgents.campaign.platform')}
              value={context.channel || 'meta'}
              onChange={(e) => onChange({ ...context, channel: e.target.value })}
              options={[
                { value: 'meta', label: t('aiAgents.campaign.platforms.meta') },
                { value: 'linkedin', label: t('aiAgents.campaign.platforms.linkedin') },
                { value: 'both', label: t('aiAgents.campaign.platforms.both') },
              ]}
            />
            <SelectField
              label={t('aiAgents.campaign.desiredStatus')}
              value={context.campaignDesiredStatus || 'paused'}
              onChange={(e) => onChange({ ...context, campaignDesiredStatus: e.target.value })}
              options={[
                { value: 'paused', label: t('aiAgents.campaign.status.paused') },
                { value: 'active', label: t('aiAgents.campaign.status.active') },
              ]}
            />
          </div>
          <TextField
            label={t('aiAgents.campaign.destinationUrl')}
            value={context.campaignDestinationUrl || ''}
            onChange={(e) => onChange({ ...context, campaignDestinationUrl: e.target.value })}
          />
          <TextField
            label={t('aiAgents.campaign.countryCode')}
            value={context.campaignCountryCode || 'US'}
            onChange={(e) => onChange({ ...context, campaignCountryCode: e.target.value })}
          />
        </>
      ) : agentId === 'screening' || agentId === 'interview' || agentId === 'offer' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label={t(`aiAgents.${agentId}.stage`)}
              value={String(context.stageId || '')}
              onChange={(e) => onChange({ ...context, stageId: e.target.value })}
              options={[
                { value: '', label: t(`aiAgents.${agentId}.stageDefault`) },
                ...stageOptions,
              ]}
            />
            <TextField
              label={
                agentId === 'offer'
                  ? t('aiAgents.offer.maxOffersToSend')
                  : t(`aiAgents.${agentId}.maxProcessed`)
              }
              type="number"
              value={String(
                agentId === 'offer'
                  ? (context.maxOffersToSend ?? context.maxProcessed ?? 10)
                  : (context.maxProcessed ?? 25),
              )}
              onChange={(e) => {
                const n = Number(e.target.value) || 0;
                if (agentId === 'offer') {
                  onChange({ ...context, maxOffersToSend: n, maxProcessed: n });
                } else {
                  onChange({ ...context, maxProcessed: n });
                }
              }}
            />
          </div>
          {(context.channel || 'email') === 'email' ? (
            <SelectField
              label={t(`aiAgents.${agentId}.template`)}
              value={context.templateId || ''}
              onChange={(e) => onChange({ ...context, templateId: e.target.value })}
              options={[
                { value: '', label: t(`aiAgents.${agentId}.templatePick`) },
                ...templateOptions,
              ]}
            />
          ) : (
            <p className="text-sm text-gray-500">{t(`aiAgents.${agentId}.whatsappHint`)}</p>
          )}
          <TextField
            label={t('aiAgents.messaging.responseWait')}
            type="number"
            value={String(context.responseWaitHours ?? 48)}
            onChange={(e) => onChange({ ...context, responseWaitHours: Number(e.target.value) || 0 })}
          />
        </>
      ) : (
        <TextField
          label={t('aiAgents.messaging.responseWait')}
          type="number"
          value={String(context.responseWaitHours ?? 48)}
          onChange={(e) => onChange({ ...context, responseWaitHours: Number(e.target.value) || 0 })}
        />
      )}

      <TextField
        label={t('aiAgents.detail.notes')}
        value={context.notes || ''}
        onChange={(e) => onChange({ ...context, notes: e.target.value })}
      />

      <div className="pt-2">
        <Button type="button" variant="primary" disabled={saving} onClick={onSave}>
          {saving ? t('aiAgents.detail.saving') : t('aiAgents.detail.save')}
        </Button>
      </div>
    </section>
  );
}
