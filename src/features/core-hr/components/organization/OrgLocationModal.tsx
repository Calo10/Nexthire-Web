import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../../components/Button';
import ErrorMessage from '../../../../components/ErrorMessage';
import Modal from '../../../../components/Modal';
import TextField from '../../../../components/TextField';
import { organizationApi } from '../../api/organizationApi';
import type { OrgLocation } from '../../models/organization';
import { apiErrorMessage } from '../../utils/employeeFormat';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  location?: OrgLocation | null;
  onSaved: (name: string, mode: 'created' | 'updated') => void;
};

export default function OrgLocationModal({ isOpen, onClose, location, onSaved }: Props) {
  const { t } = useTranslation();
  const editing = !!location;
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [isHeadquarters, setIsHeadquarters] = useState(false);
  const [isRemote, setIsRemote] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | undefined>();

  useEffect(() => {
    if (!isOpen) return;
    setName(location?.name ?? '');
    setCode(location?.code ?? '');
    setAddressLine(location?.addressLine ?? '');
    setCity(location?.city ?? '');
    setState(location?.state ?? '');
    setCountry(location?.country ?? '');
    setIsHeadquarters(location?.isHeadquarters ?? false);
    setIsRemote(location?.isRemote ?? false);
    setError(null);
    setNameError(undefined);
  }, [isOpen, location]);

  const close = () => {
    if (!busy) onClose();
  };

  const submit = async () => {
    if (!name.trim()) {
      setNameError(t('coreHr.organization.modals.location.nameRequired'));
      return;
    }
    setNameError(undefined);
    const body = {
      name: name.trim(),
      code: code.trim() || null,
      addressLine: addressLine.trim() || null,
      city: city.trim() || null,
      state: state.trim() || null,
      country: country.trim() || null,
      isHeadquarters,
      isRemote,
    };
    setBusy(true);
    setError(null);
    try {
      if (location) await organizationApi.updateLocation(location.id, body);
      else await organizationApi.createLocation(body);
      onSaved(body.name, location ? 'updated' : 'created');
    } catch (err) {
      setError(apiErrorMessage(err, t('coreHr.organization.modals.location.error')));
    } finally {
      setBusy(false);
    }
  };

  const check = 'h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500';

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={editing ? t('coreHr.organization.modals.location.editTitle') : t('coreHr.organization.modals.location.addTitle')}
      width="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" disabled={busy} onClick={close}>
            {t('common.actions.cancel')}
          </Button>
          <Button size="sm" disabled={busy} onClick={() => void submit()}>
            {busy ? t('common.actions.saving') : editing ? t('common.actions.saveChanges') : t('coreHr.organization.modals.location.create')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <ErrorMessage message={error} /> : null}
        <TextField
          label={t('coreHr.organization.modals.location.name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={nameError}
          disabled={busy}
          maxLength={120}
          required
          autoFocus
        />
        <TextField label={t('coreHr.organization.modals.location.code')} value={code} onChange={(e) => setCode(e.target.value)} disabled={busy} maxLength={30} />
        <TextField
          label={t('coreHr.organization.modals.location.address')}
          value={addressLine}
          onChange={(e) => setAddressLine(e.target.value)}
          disabled={busy}
          maxLength={200}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField label={t('coreHr.organization.modals.location.city')} value={city} onChange={(e) => setCity(e.target.value)} disabled={busy} maxLength={100} />
          <TextField label={t('coreHr.organization.modals.location.state')} value={state} onChange={(e) => setState(e.target.value)} disabled={busy} maxLength={100} />
        </div>
        <TextField
          label={t('coreHr.organization.modals.location.country')}
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          disabled={busy}
          maxLength={100}
        />
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" className={check} checked={isHeadquarters} onChange={(e) => setIsHeadquarters(e.target.checked)} disabled={busy} />
            {t('coreHr.organization.modals.location.headquarters')}
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" className={check} checked={isRemote} onChange={(e) => setIsRemote(e.target.checked)} disabled={busy} />
            {t('coreHr.organization.modals.location.remote')}
          </label>
        </div>
      </div>
    </Modal>
  );
}
