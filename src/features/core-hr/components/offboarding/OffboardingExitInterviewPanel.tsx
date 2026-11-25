import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../../components/Button';
import SelectField from '../../../../components/SelectField';
import TextField from '../../../../components/TextField';
import TextareaField from '../../../../components/TextareaField';
import { offboardingsApi } from '../../api/offboardingsApi';
import type { OffboardingLookups } from '../../hooks/useOffboardingLookups';
import { OFFBOARDING_EXIT_INTERVIEW_STATUSES, type OffboardingExitInterview } from '../../models/offboarding';
import { apiErrorMessage, formatDateTime } from '../../utils/employeeFormat';
import { parseExitResponses } from '../../utils/offboardingFormat';
import DetailField from '../DetailField';

type Props = {
  offboardingId: string;
  /** From the offboarding detail; null/undefined when no interview record exists yet. */
  interview?: OffboardingExitInterview | null;
  lookups: OffboardingLookups;
  locale: string;
  /** Offboarding.ManageExitInterviews AND the offboarding is still open. */
  canEdit: boolean;
  /** HR notes and the employee's responses are confidential. */
  canViewConfidential: boolean;
  onChanged: () => Promise<void> | void;
  onError: (message: string) => void;
};

/** ISO instant → value for `<input type="datetime-local">` (local time). */
function toLocalInput(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export default function OffboardingExitInterviewPanel({
  offboardingId,
  interview,
  lookups,
  locale,
  canEdit,
  canViewConfidential,
  onChanged,
  onError,
}: Props) {
  const { t } = useTranslation();
  const [data, setData] = useState<OffboardingExitInterview>(
    () => interview ?? { id: '', offboardingId, status: 'NotScheduled' },
  );
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('NotScheduled');
  const [interviewer, setInterviewer] = useState('');
  const [scheduled, setScheduled] = useState('');
  const [notes, setNotes] = useState('');

  // Follow the parent detail after it reloads (e.g. after saving).
  useEffect(() => {
    setData(interview ?? { id: '', offboardingId, status: 'NotScheduled' });
    setEditing(false);
  }, [interview, offboardingId]);

  const begin = () => {
    setStatus(data.status || 'NotScheduled');
    setInterviewer(data.interviewerUserId ?? '');
    setScheduled(toLocalInput(data.scheduledAt));
    setNotes(data.hrNotes ?? '');
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const updated = await offboardingsApi.updateExitInterview(offboardingId, {
        status,
        interviewerUserId: interviewer || null,
        scheduledAt: fromLocalInput(scheduled),
        // Keep the questionnaire as-is; confidential fields are only sent by users who can see them.
        questionnaireJson: data.questionnaireJson ?? null,
        ...(canViewConfidential ? { hrNotes: notes.trim() || null, responsesJson: data.responsesJson ?? null } : {}),
      });
      setData(updated);
      setEditing(false);
      await onChanged();
    } catch (err) {
      onError(apiErrorMessage(err, t('coreHr.offboarding.exitInterview.saveError')));
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="space-y-4">
        <SelectField
          label={t('coreHr.offboarding.exitInterview.status')}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={OFFBOARDING_EXIT_INTERVIEW_STATUSES.map((s) => ({ value: s, label: t(`coreHr.offboarding.exitStatus.${s}`) }))}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label={t('coreHr.offboarding.exitInterview.interviewer')}
            value={interviewer}
            onChange={(e) => setInterviewer(e.target.value)}
            options={[
              { value: '', label: t('coreHr.offboarding.checklist.unassigned') },
              ...lookups.owners.map((o) => ({ value: o.id, label: o.name })),
            ]}
          />
          <TextField
            type="datetime-local"
            label={t('coreHr.offboarding.exitInterview.scheduledAt')}
            value={scheduled}
            onChange={(e) => setScheduled(e.target.value)}
          />
        </div>
        {canViewConfidential ? (
          <TextareaField
            label={t('coreHr.offboarding.exitInterview.hrNotes')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            maxLength={4000}
          />
        ) : null}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" disabled={saving} onClick={() => setEditing(false)}>
            {t('common.actions.cancel')}
          </Button>
          <Button size="sm" disabled={saving} onClick={() => void save()}>
            {saving ? t('common.actions.saving') : t('common.actions.saveChanges')}
          </Button>
        </div>
      </div>
    );
  }

  const responses = canViewConfidential ? parseExitResponses(data.responsesJson) : [];

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <DetailField label={t('coreHr.offboarding.exitInterview.status')}>
          {t(`coreHr.offboarding.exitStatus.${data.status}`, { defaultValue: data.status })}
        </DetailField>
        <DetailField label={t('coreHr.offboarding.exitInterview.interviewer')}>{data.interviewerName}</DetailField>
        <DetailField label={t('coreHr.offboarding.exitInterview.scheduledAt')}>
          {data.scheduledAt ? formatDateTime(data.scheduledAt, locale) : null}
        </DetailField>
        {data.completedAt ? (
          <DetailField label={t('coreHr.offboarding.exitInterview.completedAt')}>{formatDateTime(data.completedAt, locale)}</DetailField>
        ) : null}
      </dl>

      {canViewConfidential ? (
        <section className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">{t('coreHr.offboarding.form.confidentialSection')}</p>
          <DetailField label={t('coreHr.offboarding.exitInterview.hrNotes')}>
            {data.hrNotes ? <span className="whitespace-pre-wrap">{data.hrNotes}</span> : null}
          </DetailField>
          {responses.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('coreHr.offboarding.exitInterview.responses')}</p>
              <ul className="space-y-2">
                {responses.map((r, i) => (
                  <li key={`${r.question}-${i}`} className="text-sm">
                    {r.question ? <p className="font-medium text-dark-text">{r.question}</p> : null}
                    <p className="whitespace-pre-wrap text-gray-700">{r.answer}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : (
        <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
          {t('coreHr.offboarding.exitInterview.confidentialHidden')}
        </p>
      )}

      {canEdit ? (
        <Button variant="outline" size="sm" onClick={begin}>
          {t('coreHr.offboarding.exitInterview.edit')}
        </Button>
      ) : null}
    </div>
  );
}
