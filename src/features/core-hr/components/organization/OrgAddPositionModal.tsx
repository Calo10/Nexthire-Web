import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../../components/Button';
import ErrorMessage from '../../../../components/ErrorMessage';
import Modal from '../../../../components/Modal';
import SelectField from '../../../../components/SelectField';
import TextField from '../../../../components/TextField';
import TextareaField from '../../../../components/TextareaField';
import { organizationApi } from '../../api/organizationApi';
import { useHrLookups } from '../../hooks/useHrLookups';
import type { OrgLevel, OrgPosition } from '../../models/organization';
import { apiErrorMessage } from '../../utils/employeeFormat';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** When set, edits this position instead of creating one. */
  position?: OrgPosition | null;
  defaultDepartmentId?: string;
  levels: OrgLevel[];
  onSaved: (title: string, mode: 'created' | 'updated') => void;
};

export default function OrgAddPositionModal({ isOpen, onClose, position, defaultDepartmentId, levels, onSaved }: Props) {
  const { t } = useTranslation();
  const lookups = useHrLookups(isOpen);
  const editing = !!position;
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [levelId, setLevelId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [headcount, setHeadcount] = useState('1');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    setTitle(position?.title ?? '');
    setCode(position?.code ?? '');
    setDescription(position?.description ?? '');
    setDepartmentId(position?.departmentId ?? defaultDepartmentId ?? '');
    setLevelId(position?.levelId ?? '');
    setLocationId(position?.locationId ?? '');
    setHeadcount(String(position?.headcount ?? 1));
    setError(null);
    setFieldErrors({});
  }, [isOpen, position, defaultDepartmentId]);

  const close = () => {
    if (!busy) onClose();
  };

  const submit = async () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = t('coreHr.organization.modals.position.titleRequired');
    if (!departmentId) errs.department = t('coreHr.organization.modals.position.departmentRequired');
    const hc = Number(headcount);
    if (!Number.isInteger(hc) || hc < 1) errs.headcount = t('coreHr.organization.modals.position.headcountInvalid');
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const body = {
      title: title.trim(),
      code: code.trim() || null,
      description: description.trim() || null,
      departmentId,
      levelId: levelId || null,
      locationId: locationId || null,
      headcount: hc,
    };
    setBusy(true);
    setError(null);
    try {
      if (position) await organizationApi.updatePosition(position.id, body);
      else await organizationApi.createPosition(body);
      onSaved(body.title, position ? 'updated' : 'created');
    } catch (err) {
      setError(apiErrorMessage(err, t('coreHr.organization.modals.position.error')));
    } finally {
      setBusy(false);
    }
  };

  const departments = lookups.departments.filter((d) => d.isActive || d.id === departmentId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={editing ? t('coreHr.organization.modals.position.editTitle') : t('coreHr.organization.modals.position.addTitle')}
      width="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" disabled={busy} onClick={close}>
            {t('common.actions.cancel')}
          </Button>
          <Button size="sm" disabled={busy} onClick={() => void submit()}>
            {busy ? t('common.actions.saving') : editing ? t('common.actions.saveChanges') : t('coreHr.organization.modals.position.create')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <ErrorMessage message={error} /> : null}
        {lookups.error ? <ErrorMessage message={t('coreHr.organization.modals.lookupsError')} /> : null}
        <TextField
          label={t('coreHr.organization.modals.position.title')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={fieldErrors.title}
          disabled={busy}
          maxLength={150}
          required
          autoFocus
        />
        <SelectField
          label={t('coreHr.organization.modals.position.department')}
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          error={fieldErrors.department}
          disabled={busy || lookups.loading}
          required
          options={[
            { value: '', label: lookups.loading ? t('common.loading') : t('coreHr.organization.modals.position.departmentPlaceholder') },
            ...departments.map((d) => ({ value: d.id, label: d.name })),
          ]}
        />
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label={t('coreHr.organization.modals.position.level')}
            value={levelId}
            onChange={(e) => setLevelId(e.target.value)}
            disabled={busy}
            options={[{ value: '', label: t('common.none') }, ...levels.map((l) => ({ value: l.id, label: l.name }))]}
          />
          <TextField
            label={t('coreHr.organization.modals.position.headcount')}
            type="number"
            min={1}
            step={1}
            value={headcount}
            onChange={(e) => setHeadcount(e.target.value)}
            error={fieldErrors.headcount}
            disabled={busy}
          />
        </div>
        <SelectField
          label={t('coreHr.organization.modals.position.location')}
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          disabled={busy || lookups.loading}
          options={[
            { value: '', label: t('common.none') },
            ...lookups.locations.filter((l) => l.isActive || l.id === locationId).map((l) => ({ value: l.id, label: l.name })),
          ]}
        />
        <TextField
          label={t('coreHr.organization.modals.position.code')}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={busy}
          maxLength={30}
        />
        <TextareaField
          label={t('coreHr.organization.modals.position.description')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={busy}
          maxLength={500}
          rows={3}
        />
      </div>
    </Modal>
  );
}
