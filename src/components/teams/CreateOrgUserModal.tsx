import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal';
import Button from '../Button';
import TextField from '../TextField';
import SelectField from '../SelectField';
import ErrorMessage from '../ErrorMessage';
import { orgUsersApi } from '../../api/orgUsersApi';
import { getCountryCallingCodeOptions, onlyDigits, toE164Phone } from '../../lib/phone';
import type { Role } from '../../types/teams';

const NON_INVITE_ROLE_CODES = new Set(['account_admin', 'org_admin', 'admin']);

interface CreateOrgUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  roles: Role[];
  rolesLoading: boolean;
  teamName?: string | null;
  onCreated: (userId: string) => Promise<void>;
}

export default function CreateOrgUserModal({
  isOpen,
  onClose,
  roles,
  rolesLoading,
  teamName,
  onCreated,
}: CreateOrgUserModalProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('506');
  const [phoneNationalNumber, setPhoneNationalNumber] = useState('');
  const [nextHireRoleId, setNextHireRoleId] = useState('');
  const [sendLoginLink, setSendLoginLink] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const inviteRoles = useMemo(
    () => roles.filter((r) => !r.code || !NON_INVITE_ROLE_CODES.has(r.code.toLowerCase())),
    [roles]
  );

  const countryOptions = useMemo(() => getCountryCallingCodeOptions(), []);

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setFirstName('');
      setLastName('');
      setPhoneCountryCode('506');
      setPhoneNationalNumber('');
      setNextHireRoleId('');
      setSendLoginLink(true);
      setError(null);
      setSuccess(false);
      setSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      setError(t('teams.inviteUser.errors.required'));
      return;
    }

    const phoneE164 = toE164Phone(phoneCountryCode, phoneNationalNumber);

    setSubmitting(true);
    try {
      const result = await orgUsersApi.create({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phoneE164 || undefined,
        nexaOrgRole: 'member',
        nextHireRoleId: nextHireRoleId || undefined,
        sendLoginLink,
      });

      await onCreated(result.user.id);
      setSuccess(true);
      window.setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : t('teams.inviteUser.errors.create');
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('teams.inviteUser.title')}
      subtitle={teamName ? t('teams.inviteUser.subtitleTeam', { team: teamName }) : t('teams.inviteUser.subtitle')}
      width="md"
      footer={
        success ? null : (
          <>
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              {t('common.actions.cancel')}
            </Button>
            <Button type="submit" form="create-org-user-form" disabled={submitting}>
              {submitting ? t('teams.inviteUser.sending') : t('teams.inviteUser.submit')}
            </Button>
          </>
        )
      }
    >
      {success ? (
        <div className="text-center py-8 space-y-3">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm text-gray-700">{t('teams.inviteUser.success', { email: email.trim() })}</p>
        </div>
      ) : (
        <form id="create-org-user-form" onSubmit={handleSubmit} className="space-y-4">
          {error ? <ErrorMessage message={error} /> : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="invite-first-name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('teams.inviteUser.firstName')} <span className="text-red-500">*</span>
              </label>
              <input
                id="invite-first-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={submitting}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
            <div>
              <label htmlFor="invite-last-name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('teams.inviteUser.lastName')} <span className="text-red-500">*</span>
              </label>
              <input
                id="invite-last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={submitting}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 mb-1">
              {t('teams.inviteUser.email')} <span className="text-red-500">*</span>
            </label>
            <input
              id="invite-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('teams.inviteUser.emailPlaceholder')}
              required
              disabled={submitting}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>

          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-2">
              <SelectField
                label={t('teams.inviteUser.phoneCountry')}
                value={phoneCountryCode}
                onChange={(e) => setPhoneCountryCode(e.target.value)}
                options={countryOptions}
                disabled={submitting}
              />
            </div>
            <div className="col-span-3">
              <TextField
                label={t('teams.inviteUser.phoneNumber')}
                type="tel"
                value={phoneNationalNumber}
                onChange={(e) => setPhoneNationalNumber(onlyDigits(e.target.value))}
                placeholder={t('teams.inviteUser.phoneNumberPlaceholder')}
                disabled={submitting}
              />
            </div>
          </div>

          <div>
            <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700 mb-1">
              {t('teams.inviteUser.appRole')}
            </label>
            <select
              id="invite-role"
              value={nextHireRoleId}
              onChange={(e) => setNextHireRoleId(e.target.value)}
              disabled={submitting || rolesLoading}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-white"
            >
              <option value="">{rolesLoading ? t('common.loading') : t('teams.inviteUser.appRoleDefault')}</option>
              {inviteRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                  {r.code ? ` (${r.code})` : ''}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">{t('teams.inviteUser.appRoleHint')}</p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={sendLoginLink}
              onChange={(e) => setSendLoginLink(e.target.checked)}
              disabled={submitting}
              className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-700">{t('teams.inviteUser.sendLoginLink')}</span>
          </label>
        </form>
      )}
    </Modal>
  );
}
