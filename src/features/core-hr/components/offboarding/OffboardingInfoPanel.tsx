import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../../components/Button';
import SelectField from '../../../../components/SelectField';
import TextField from '../../../../components/TextField';
import TextareaField from '../../../../components/TextareaField';
import { offboardingsApi } from '../../api/offboardingsApi';
import type { OffboardingLookups } from '../../hooks/useOffboardingLookups';
import { REHIRE_ELIGIBILITIES, SEPARATION_TYPES, type OffboardingDetail } from '../../models/offboarding';
import { apiErrorMessage, formatDate } from '../../utils/employeeFormat';
import { dateOnly, isActiveOffboarding } from '../../utils/offboardingFormat';
import DetailField from '../DetailField';

type Props = {
  detail: OffboardingDetail;
  lookups: OffboardingLookups;
  locale: string;
  canEdit: boolean;
  /** Separation reason, rehire eligibility and confidential notes are only shown/edited with this capability. */
  canViewConfidential: boolean;
  onSaved: (detail: OffboardingDetail) => void;
  onError: (message: string) => void;
};

export default function OffboardingInfoPanel({ detail, lookups, locale, canEdit, canViewConfidential, onSaved, onError }: Props) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [owner, setOwner] = useState('');
  const [separationType, setSeparationType] = useState('');
  const [notice, setNotice] = useState('');
  const [lastDay, setLastDay] = useState('');
  const [effective, setEffective] = useState('');
  const [expected, setExpected] = useState('');
  const [reason, setReason] = useState('');
  const [rehire, setRehire] = useState('');
  const [notes, setNotes] = useState('');

  const open = isActiveOffboarding(detail.status);

  const begin = () => {
    setOwner(detail.ownerUserId ?? '');
    setSeparationType(detail.separationType ?? '');
    setNotice(dateOnly(detail.noticeDate));
    setLastDay(dateOnly(detail.lastWorkingDay));
    setEffective(dateOnly(detail.terminationEffectiveDate));
    setExpected(dateOnly(detail.expectedCompletionDate));
    setReason(detail.separationReason ?? '');
    setRehire(detail.rehireEligibility ?? '');
    setNotes(detail.confidentialNotes ?? '');
    setEditing(true);
  };

  const lastDayError = notice && lastDay && lastDay < notice ? t('coreHr.offboarding.form.lastDayBeforeNotice') : undefined;
  const effectiveError = lastDay && effective && effective < lastDay ? t('coreHr.offboarding.form.effectiveBeforeLastDay') : undefined;
  const invalid = !lastDay || !!lastDayError || !!effectiveError;

  const save = async () => {
    if (invalid) return;
    setSaving(true);
    try {
      const updated = await offboardingsApi.update(detail.id, {
        ownerUserId: owner || null,
        separationType: separationType || null,
        noticeDate: notice || null,
        lastWorkingDay: lastDay || null,
        terminationEffectiveDate: effective || null,
        expectedCompletionDate: expected || null,
        ...(canViewConfidential
          ? {
              separationReason: reason.trim() || null,
              rehireEligibility: rehire || null,
              confidentialNotes: notes.trim() || null,
            }
          : {}),
      });
      setEditing(false);
      onSaved(updated);
    } catch (err) {
      onError(apiErrorMessage(err, t('coreHr.offboarding.drawer.saveError')));
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="space-y-4">
        <SelectField
          label={t('coreHr.offboarding.form.owner')}
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          options={[
            { value: '', label: t('coreHr.offboarding.form.noOwner') },
            ...lookups.owners.map((o) => ({ value: o.id, label: o.name })),
          ]}
        />
        <SelectField
          label={t('coreHr.offboarding.form.separationType')}
          value={separationType}
          onChange={(e) => setSeparationType(e.target.value)}
          options={SEPARATION_TYPES.map((s) => ({ value: s, label: t(`coreHr.offboarding.separationType.${s}`) }))}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField type="date" label={t('coreHr.offboarding.form.noticeDate')} value={notice} onChange={(e) => setNotice(e.target.value)} />
          <TextField
            type="date"
            label={t('coreHr.offboarding.form.lastWorkingDay')}
            value={lastDay}
            min={notice || undefined}
            onChange={(e) => setLastDay(e.target.value)}
            error={lastDayError}
            required
          />
          <TextField
            type="date"
            label={t('coreHr.offboarding.form.terminationEffectiveDate')}
            value={effective}
            min={lastDay || undefined}
            onChange={(e) => setEffective(e.target.value)}
            error={effectiveError}
          />
          <TextField
            type="date"
            label={t('coreHr.offboarding.form.expectedCompletion')}
            value={expected}
            onChange={(e) => setExpected(e.target.value)}
          />
        </div>
        {canViewConfidential ? (
          <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">{t('coreHr.offboarding.form.confidentialSection')}</p>
            <TextareaField
              label={t('coreHr.offboarding.form.separationReason')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={1000}
            />
            <SelectField
              label={t('coreHr.offboarding.form.rehireEligibility')}
              value={rehire}
              onChange={(e) => setRehire(e.target.value)}
              options={[
                { value: '', label: t('coreHr.offboarding.form.notSet') },
                ...REHIRE_ELIGIBILITIES.map((r) => ({ value: r, label: t(`coreHr.offboarding.rehire.${r}`) })),
              ]}
            />
            <TextareaField
              label={t('coreHr.offboarding.form.confidentialNotes')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              maxLength={4000}
            />
          </div>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" disabled={saving} onClick={() => setEditing(false)}>
            {t('common.actions.cancel')}
          </Button>
          <Button size="sm" disabled={saving || invalid} onClick={() => void save()}>
            {saving ? t('common.actions.saving') : t('common.actions.saveChanges')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <DetailField label={t('coreHr.offboarding.drawer.employeeNumber')}>{detail.employeeNumber}</DetailField>
        <DetailField label={t('coreHr.offboarding.drawer.department')}>{detail.department}</DetailField>
        <DetailField label={t('coreHr.offboarding.drawer.email')}>{detail.employeeEmail}</DetailField>
        <DetailField label={t('coreHr.offboarding.form.owner')}>{detail.ownerName}</DetailField>
        <DetailField label={t('coreHr.offboarding.form.separationType')}>
          {t(`coreHr.offboarding.separationType.${detail.separationType}`, { defaultValue: detail.separationType })}
        </DetailField>
        <DetailField label={t('coreHr.offboarding.form.template')}>
          {detail.templateName
            ? detail.templateVersion
              ? `${detail.templateName} (v${detail.templateVersion})`
              : detail.templateName
            : null}
        </DetailField>
        <DetailField label={t('coreHr.offboarding.form.noticeDate')}>{formatDate(detail.noticeDate, locale)}</DetailField>
        <DetailField label={t('coreHr.offboarding.form.lastWorkingDay')}>{formatDate(detail.lastWorkingDay, locale)}</DetailField>
        <DetailField label={t('coreHr.offboarding.form.processStartDate')}>{formatDate(detail.processStartDate, locale)}</DetailField>
        <DetailField label={t('coreHr.offboarding.form.terminationEffectiveDate')}>
          {formatDate(detail.terminationEffectiveDate, locale)}
        </DetailField>
        <DetailField label={t('coreHr.offboarding.form.expectedCompletion')}>
          {formatDate(detail.expectedCompletionDate, locale)}
        </DetailField>
        <DetailField label={t('coreHr.offboarding.table.progress')}>
          {t('coreHr.offboarding.table.tasksCount', { done: detail.completedTasks, total: detail.totalTasks })}
        </DetailField>
        <DetailField label={t('coreHr.offboarding.form.notifyEmployee')}>
          {detail.notifyEmployee ? t('coreHr.offboarding.yes') : t('coreHr.offboarding.no')}
        </DetailField>
        {detail.actualCompletionDate ? (
          <DetailField label={t('coreHr.offboarding.drawer.completedOn')}>{formatDate(detail.actualCompletionDate, locale)}</DetailField>
        ) : null}
        {detail.cancelReason ? (
          <DetailField label={t('coreHr.offboarding.drawer.cancelReason')}>{detail.cancelReason}</DetailField>
        ) : null}
      </dl>

      {!canViewConfidential ? (
        <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
          {t('coreHr.offboarding.form.confidentialHidden')}
        </p>
      ) : (
        <section className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">{t('coreHr.offboarding.form.confidentialSection')}</p>
          <DetailField label={t('coreHr.offboarding.form.separationReason')}>
            {detail.separationReason ? <span className="whitespace-pre-wrap">{detail.separationReason}</span> : null}
          </DetailField>
          <DetailField label={t('coreHr.offboarding.form.rehireEligibility')}>
            {detail.rehireEligibility
              ? t(`coreHr.offboarding.rehire.${detail.rehireEligibility}`, { defaultValue: detail.rehireEligibility })
              : null}
          </DetailField>
          <DetailField label={t('coreHr.offboarding.form.confidentialNotes')}>
            {detail.confidentialNotes ? <span className="whitespace-pre-wrap">{detail.confidentialNotes}</span> : null}
          </DetailField>
        </section>
      )}

      {canEdit && open ? (
        <Button variant="outline" size="sm" onClick={begin}>
          {t('coreHr.offboarding.drawer.editDetails')}
        </Button>
      ) : null}
    </div>
  );
}
