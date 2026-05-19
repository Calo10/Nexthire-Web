import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal';
import Button from '../Button';
import TextField from '../TextField';
import SelectField from '../SelectField';
import ErrorMessage from '../ErrorMessage';
import { createSourcingLead } from '../../api/sourcingApi';

const LEVELS = (t: (k: string) => string) => [
  { value: '', label: t('sourcing.leadForm.levelNone') },
  { value: 'none', label: t('sourcing.leadForm.levelValueNone') },
  { value: 'basic', label: t('sourcing.leadForm.levelBasic') },
  { value: 'intermediate', label: t('sourcing.leadForm.levelIntermediate') },
  { value: 'fluent', label: t('sourcing.leadForm.levelFluent') },
  { value: 'native', label: t('sourcing.leadForm.levelNative') },
];

const SOURCES = (t: (k: string) => string) => [
  { value: 'manual_entry', label: t('sourcing.leadForm.sourceManual') },
  { value: 'meta_ads', label: t('sourcing.leadForm.sourceMetaAds') },
  { value: 'whatsapp', label: t('sourcing.leadForm.sourceWhatsApp') },
  { value: 'landing_page', label: t('sourcing.leadForm.sourceLandingPage') },
  { value: 'qr_code', label: t('sourcing.leadForm.sourceQrCode') },
  { value: 'referral', label: t('sourcing.leadForm.sourceReferral') },
];

const AVAIL = (t: (k: string) => string) => [
  { value: '', label: t('sourcing.leadForm.availAny') },
  { value: 'today', label: t('sourcing.availability.today') },
  { value: 'this_week', label: t('sourcing.availability.thisWeek') },
  { value: 'next_week', label: t('sourcing.availability.nextWeek') },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LeadModal({ isOpen, onClose, onSuccess }: Props) {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    fullName: '',
    phone: '',
    email: '',
    desiredRole: '',
    currentRole: '',
    sourceType: 'manual_entry',
    city: '',
    state: '',
    zipCode: '',
    availability: '',
    experienceYears: '',
    englishLevel: '',
    spanishLevel: '',
    hasTransportation: false,
    fitScore: '',
    qualificationNotes: '',
  });

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setForm({
      firstName: '',
      lastName: '',
      fullName: '',
      phone: '',
      email: '',
      desiredRole: '',
      currentRole: '',
      sourceType: 'manual_entry',
      city: '',
      state: '',
      zipCode: '',
      availability: '',
      experienceYears: '',
      englishLevel: '',
      spanishLevel: '',
      hasTransportation: false,
      fitScore: '',
      qualificationNotes: '',
    });
  }, [isOpen]);

  const levelOpts = LEVELS(t);
  const sourceOpts = SOURCES(t);
  const availOpts = AVAIL(t);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        fullName: form.fullName || [form.firstName, form.lastName].filter(Boolean).join(' ') || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        desiredRole: form.desiredRole || undefined,
        currentRole: form.currentRole || undefined,
        sourceType: form.sourceType || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        zipCode: form.zipCode || undefined,
        availability: form.availability || undefined,
        experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
        englishLevel: form.englishLevel || undefined,
        spanishLevel: form.spanishLevel || undefined,
        hasTransportation: form.hasTransportation,
        fitScore: form.fitScore ? Number(form.fitScore) : undefined,
        qualificationNotes: form.qualificationNotes || undefined,
      };
      await createSourcingLead(payload);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : t('sourcing.errors.saveLead'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('sourcing.leadForm.title')}
      subtitle={t('sourcing.leadForm.subtitle')}
      width="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={onClose}>
            {t('common.actions.cancel')}
          </Button>
          <Button variant="primary" type="submit" form="new-lead-form" disabled={saving}>
            {saving ? t('common.actions.creating') : t('sourcing.leadForm.submit')}
          </Button>
        </div>
      }
    >
      {error ? <ErrorMessage message={error} /> : null}
      <form id="new-lead-form" onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label={t('sourcing.leadForm.firstName')} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          <TextField label={t('sourcing.leadForm.lastName')} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          <div className="md:col-span-2">
            <TextField label={t('sourcing.leadForm.fullName')} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <TextField label={t('sourcing.leadForm.phone')} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <TextField label={t('sourcing.leadForm.email')} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <TextField label={t('sourcing.leadForm.desiredRole')} value={form.desiredRole} onChange={(e) => setForm({ ...form, desiredRole: e.target.value })} />
          <TextField label={t('sourcing.leadForm.currentRole')} value={form.currentRole} onChange={(e) => setForm({ ...form, currentRole: e.target.value })} />
          <SelectField
            label={t('sourcing.leadForm.sourceType')}
            value={form.sourceType}
            onChange={(e) => setForm({ ...form, sourceType: e.target.value })}
            options={sourceOpts}
          />
          <TextField label={t('sourcing.leadForm.city')} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <TextField label={t('sourcing.leadForm.state')} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          <TextField label={t('sourcing.leadForm.zip')} value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} />
          <SelectField
            label={t('sourcing.leadForm.availability')}
            value={form.availability}
            onChange={(e) => setForm({ ...form, availability: e.target.value })}
            options={availOpts}
          />
          <TextField
            label={t('sourcing.leadForm.experienceYears')}
            type="number"
            min={0}
            value={form.experienceYears}
            onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
          />
          <SelectField
            label={t('sourcing.leadForm.englishLevel')}
            value={form.englishLevel}
            onChange={(e) => setForm({ ...form, englishLevel: e.target.value })}
            options={levelOpts}
          />
          <SelectField
            label={t('sourcing.leadForm.spanishLevel')}
            value={form.spanishLevel}
            onChange={(e) => setForm({ ...form, spanishLevel: e.target.value })}
            options={levelOpts}
          />
          <TextField
            label={t('sourcing.leadForm.fitScore')}
            type="number"
            min={0}
            max={100}
            value={form.fitScore}
            onChange={(e) => setForm({ ...form, fitScore: e.target.value })}
          />
          <div className="md:col-span-2 flex items-center gap-2 pt-2">
            <input
              id="hasTransportation"
              type="checkbox"
              checked={form.hasTransportation}
              onChange={(e) => setForm({ ...form, hasTransportation: e.target.checked })}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="hasTransportation" className="text-sm font-medium text-gray-700">
              {t('sourcing.leadForm.hasTransportation')}
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('sourcing.leadForm.notes')}</label>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm min-h-[100px]"
              value={form.qualificationNotes}
              onChange={(e) => setForm({ ...form, qualificationNotes: e.target.value })}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
