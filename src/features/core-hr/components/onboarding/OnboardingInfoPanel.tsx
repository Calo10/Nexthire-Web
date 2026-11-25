import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../../components/Button';
import SelectField from '../../../../components/SelectField';
import TextField from '../../../../components/TextField';
import TextareaField from '../../../../components/TextareaField';
import { onboardingsApi } from '../../api/onboardingsApi';
import type { OnboardingLookups } from '../../hooks/useOnboardingLookups';
import type { OnboardingDetail } from '../../models/onboarding';
import { apiErrorMessage, formatDate } from '../../utils/employeeFormat';
import { dateOnly } from '../../utils/onboardingFormat';
import DetailField from '../DetailField';

type Props = {
  detail: OnboardingDetail;
  lookups: OnboardingLookups;
  locale: string;
  canEdit: boolean;
  onSaved: (detail: OnboardingDetail) => void;
  onError: (message: string) => void;
};

export default function OnboardingInfoPanel({ detail, lookups, locale, canEdit, onSaved, onError }: Props) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [owner, setOwner] = useState('');
  const [start, setStart] = useState('');
  const [expected, setExpected] = useState('');
  const [notes, setNotes] = useState('');

  const open = detail.status === 'NotStarted' || detail.status === 'InProgress' || detail.status === 'InReview';

  const begin = () => {
    setOwner(detail.ownerUserId ?? '');
    setStart(dateOnly(detail.startDate));
    setExpected(dateOnly(detail.expectedCompletionDate));
    setNotes(detail.notes ?? '');
    setEditing(true);
  };

  const dateError = start && expected && expected < start ? t('coreHr.onboarding.form.dateOrderError') : undefined;

  const save = async () => {
    if (dateError) return;
    setSaving(true);
    try {
      const updated = await onboardingsApi.update(detail.id, {
        ownerUserId: owner || null,
        startDate: start || null,
        expectedCompletionDate: expected || null,
        notes: notes.trim() || null,
      });
      setEditing(false);
      onSaved(updated);
    } catch (err) {
      onError(apiErrorMessage(err, t('coreHr.onboarding.drawer.saveError')));
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="space-y-4">
        <SelectField
          label={t('coreHr.onboarding.form.owner')}
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          options={[
            { value: '', label: t('coreHr.onboarding.form.noOwner') },
            ...lookups.owners.map((o) => ({ value: o.id, label: o.name })),
          ]}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField type="date" label={t('coreHr.onboarding.form.startDate')} value={start} onChange={(e) => setStart(e.target.value)} />
          <TextField
            type="date"
            label={t('coreHr.onboarding.form.expectedCompletion')}
            value={expected}
            min={start || undefined}
            onChange={(e) => setExpected(e.target.value)}
            error={dateError}
          />
        </div>
        <TextareaField label={t('coreHr.onboarding.form.notes')} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" disabled={saving} onClick={() => setEditing(false)}>
            {t('common.actions.cancel')}
          </Button>
          <Button size="sm" disabled={saving || !!dateError} onClick={() => void save()}>
            {saving ? t('common.actions.saving') : t('common.actions.saveChanges')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <DetailField label={t('coreHr.onboarding.drawer.employeeNumber')}>{detail.employeeNumber}</DetailField>
        <DetailField label={t('coreHr.onboarding.drawer.department')}>{detail.department}</DetailField>
        <DetailField label={t('coreHr.onboarding.drawer.email')}>{detail.employeeEmail}</DetailField>
        <DetailField label={t('coreHr.onboarding.form.owner')}>{detail.ownerName}</DetailField>
        <DetailField label={t('coreHr.onboarding.form.template')}>
          {detail.templateName
            ? detail.templateVersion
              ? `${detail.templateName} (v${detail.templateVersion})`
              : detail.templateName
            : null}
        </DetailField>
        <DetailField label={t('coreHr.onboarding.table.progress')}>
          {t('coreHr.onboarding.table.tasksCount', { done: detail.completedTasks, total: detail.totalTasks })}
        </DetailField>
        <DetailField label={t('coreHr.onboarding.form.startDate')}>{formatDate(detail.startDate, locale)}</DetailField>
        <DetailField label={t('coreHr.onboarding.form.expectedCompletion')}>
          {formatDate(detail.expectedCompletionDate, locale)}
        </DetailField>
        {detail.actualCompletionDate ? (
          <DetailField label={t('coreHr.onboarding.drawer.completedOn')}>{formatDate(detail.actualCompletionDate, locale)}</DetailField>
        ) : null}
        {detail.cancelReason ? (
          <DetailField label={t('coreHr.onboarding.drawer.cancelReason')}>{detail.cancelReason}</DetailField>
        ) : null}
      </dl>
      <DetailField label={t('coreHr.onboarding.form.notes')}>
        {detail.notes ? <span className="whitespace-pre-wrap">{detail.notes}</span> : null}
      </DetailField>
      {canEdit && open ? (
        <Button variant="outline" size="sm" onClick={begin}>
          {t('coreHr.onboarding.drawer.editDetails')}
        </Button>
      ) : null}
    </div>
  );
}
