import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import Badge from '../../../../components/ui/Badge';
import Button from '../../../../components/Button';
import ConfirmModal from '../../../../components/ui/ConfirmModal';
import SelectField from '../../../../components/SelectField';
import TextField from '../../../../components/TextField';
import { offboardingsApi } from '../../api/offboardingsApi';
import type { OffboardingLookups } from '../../hooks/useOffboardingLookups';
import {
  OFFBOARDING_ACCESS_STATUSES,
  OFFBOARDING_ASSET_STATUSES,
  OFFBOARDING_SETTLEMENT_STATUSES,
  type OffboardingAccessItem,
  type OffboardingAsset,
  type OffboardingSettlementItem,
} from '../../models/offboarding';
import { apiErrorMessage, formatDate, formatMoney } from '../../utils/employeeFormat';
import { accessStatusTone, assetStatusTone, settlementStatusTone, todayInput } from '../../utils/offboardingFormat';
import ReasonModal from '../onboarding/ReasonModal';

type Props = {
  offboardingId: string;
  assets: OffboardingAsset[];
  accessItems: OffboardingAccessItem[];
  settlementItems: OffboardingSettlementItem[];
  lookups: OffboardingLookups;
  locale: string;
  /** Offboarding.ManageAssets AND the offboarding is still open. */
  canManageAssets: boolean;
  /** Offboarding.ManageAccess AND the offboarding is still open. */
  canManageAccess: boolean;
  /** Offboarding.ManageSettlement AND the offboarding is still open. */
  canManageSettlement: boolean;
  /** Reload the parent detail (blockers, progress, lists) and activity after a change. */
  onChanged: () => Promise<void> | void;
  onError: (message: string) => void;
};

const selectClass =
  'h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60';

function Section({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
        {title} <span className="font-normal text-gray-400">({count})</span>
      </h3>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">{text}</p>;
}

function RemoveButton({ label, disabled, onClick }: { label: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 disabled:opacity-50"
      aria-label={label}
      title={label}
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

export default function OffboardingAssetsAccessPanel({
  offboardingId,
  assets,
  accessItems: access,
  settlementItems: settlement,
  lookups,
  locale,
  canManageAssets,
  canManageAccess,
  canManageSettlement,
  onChanged,
  onError,
}: Props) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState<string | null>(null);

  // Add forms
  const [addingAsset, setAddingAsset] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState('');
  const [assetSerial, setAssetSerial] = useState('');
  const [assetDue, setAssetDue] = useState('');
  const [addingAccess, setAddingAccess] = useState(false);
  const [systemName, setSystemName] = useState('');
  const [responsible, setResponsible] = useState('');
  const [saving, setSaving] = useState(false);

  const [waiveAsset, setWaiveAsset] = useState<OffboardingAsset | null>(null);
  const [removeAsset, setRemoveAsset] = useState<OffboardingAsset | null>(null);
  const [removeAccess, setRemoveAccess] = useState<OffboardingAccessItem | null>(null);

  const run = async (key: string, fn: () => Promise<unknown>, fallback: string) => {
    setBusy(key);
    try {
      await fn();
      await onChanged();
    } catch (err) {
      onError(apiErrorMessage(err, fallback));
    } finally {
      setBusy(null);
    }
  };

  const changeAssetStatus = (a: OffboardingAsset, status: string) => {
    if (status === a.status) return;
    if (status === 'Waived') {
      setWaiveAsset(a);
      return;
    }
    void run(
      a.id,
      () =>
        offboardingsApi.updateAssetStatus(offboardingId, a.id, {
          status,
          actualReturnDate: status === 'Returned' ? todayInput() : null,
        }),
      t('coreHr.offboarding.assetsAccess.assets.updateError'),
    );
  };

  const addAsset = async () => {
    if (!assetName.trim()) return;
    setSaving(true);
    try {
      await offboardingsApi.addAsset(offboardingId, {
        assetName: assetName.trim(),
        assetType: assetType.trim() || null,
        serialNumber: assetSerial.trim() || null,
        returnRequired: true,
        expectedReturnDate: assetDue || null,
      });
      setAssetName('');
      setAssetType('');
      setAssetSerial('');
      setAssetDue('');
      setAddingAsset(false);
      await onChanged();
    } catch (err) {
      onError(apiErrorMessage(err, t('coreHr.offboarding.assetsAccess.assets.addError')));
    } finally {
      setSaving(false);
    }
  };

  const changeAccessStatus = (item: OffboardingAccessItem, status: string) => {
    if (status === item.status) return;
    void run(
      item.id,
      () => offboardingsApi.updateAccessStatus(offboardingId, item.id, { status }),
      t('coreHr.offboarding.assetsAccess.access.updateError'),
    );
  };

  const addAccess = async () => {
    if (!systemName.trim()) return;
    setSaving(true);
    try {
      await offboardingsApi.addAccess(offboardingId, {
        systemName: systemName.trim(),
        responsibleUserId: responsible || null,
      });
      setSystemName('');
      setResponsible('');
      setAddingAccess(false);
      await onChanged();
    } catch (err) {
      onError(apiErrorMessage(err, t('coreHr.offboarding.assetsAccess.access.addError')));
    } finally {
      setSaving(false);
    }
  };

  const changeSettlementStatus = (item: OffboardingSettlementItem, status: string) => {
    if (status === item.status) return;
    void run(
      item.id,
      () =>
        offboardingsApi.updateSettlementItem(offboardingId, item.id, {
          status,
          // Amounts are withheld (null) from callers without access: leave them out so they are never overwritten.
          ...(item.amount != null ? { amount: item.amount, currency: item.currency ?? null } : {}),
          notes: item.notes ?? null,
        }),
      t('coreHr.offboarding.assetsAccess.settlement.updateError'),
    );
  };

  return (
    <div className="space-y-8">
      {/* Assets */}
      <Section title={t('coreHr.offboarding.assetsAccess.assets.title')} count={assets.length}>
        {assets.length === 0 ? (
          <Empty text={t('coreHr.offboarding.assetsAccess.assets.empty')} />
        ) : (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
            {assets.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-dark-text">{a.assetName}</p>
                  <p className="text-xs text-gray-500">
                    {[a.assetType, a.serialNumber ? `S/N ${a.serialNumber}` : null].filter(Boolean).join(' · ') || '—'}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {a.actualReturnDate
                      ? t('coreHr.offboarding.assetsAccess.assets.returnedOn', { date: formatDate(a.actualReturnDate, locale) })
                      : a.expectedReturnDate
                        ? t('coreHr.offboarding.assetsAccess.assets.dueOn', { date: formatDate(a.expectedReturnDate, locale) })
                        : null}
                    {a.returnRequired ? null : ` · ${t('coreHr.offboarding.checklist.optional')}`}
                  </p>
                  {a.status === 'Waived' && a.waiveReason ? <p className="mt-0.5 text-xs text-gray-400">{a.waiveReason}</p> : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {canManageAssets ? (
                    <select
                      aria-label={t('coreHr.offboarding.assetsAccess.status')}
                      value={a.status}
                      disabled={busy === a.id}
                      onChange={(e) => changeAssetStatus(a, e.target.value)}
                      className={selectClass}
                    >
                      {OFFBOARDING_ASSET_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {t(`coreHr.offboarding.assetStatus.${s}`)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Badge tone={assetStatusTone(a.status)}>
                      {t(`coreHr.offboarding.assetStatus.${a.status}`, { defaultValue: a.status })}
                    </Badge>
                  )}
                  {canManageAssets ? (
                    <RemoveButton
                      label={t('coreHr.offboarding.assetsAccess.assets.remove')}
                      disabled={busy === a.id}
                      onClick={() => setRemoveAsset(a)}
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
        {canManageAssets ? (
          addingAsset ? (
            <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <TextField
                label={t('coreHr.offboarding.assetsAccess.assets.name')}
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                maxLength={200}
                required
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <TextField
                  label={t('coreHr.offboarding.assetsAccess.assets.type')}
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  maxLength={80}
                />
                <TextField
                  label={t('coreHr.offboarding.assetsAccess.assets.serial')}
                  value={assetSerial}
                  onChange={(e) => setAssetSerial(e.target.value)}
                  maxLength={120}
                />
                <TextField
                  type="date"
                  label={t('coreHr.offboarding.assetsAccess.assets.expectedReturn')}
                  value={assetDue}
                  onChange={(e) => setAssetDue(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" disabled={saving} onClick={() => setAddingAsset(false)}>
                  {t('common.actions.cancel')}
                </Button>
                <Button size="sm" disabled={saving || !assetName.trim()} onClick={() => void addAsset()}>
                  {saving ? t('common.loading') : t('coreHr.offboarding.assetsAccess.assets.add')}
                </Button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setAddingAsset(true)} className="text-sm font-medium text-teal-700 hover:text-teal-900">
              + {t('coreHr.offboarding.assetsAccess.assets.add')}
            </button>
          )
        ) : null}
      </Section>

      {/* System access */}
      <Section title={t('coreHr.offboarding.assetsAccess.access.title')} count={access.length}>
        {access.length === 0 ? (
          <Empty text={t('coreHr.offboarding.assetsAccess.access.empty')} />
        ) : (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
            {access.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-dark-text">{item.systemName}</p>
                  <p className="text-xs text-gray-500">
                    {item.responsibleUserName || t('coreHr.offboarding.checklist.unassigned')}
                    {item.revokedAt
                      ? ` · ${t('coreHr.offboarding.assetsAccess.access.revokedOn', { date: formatDate(item.revokedAt, locale) })}`
                      : item.scheduledAt
                        ? ` · ${t('coreHr.offboarding.assetsAccess.access.scheduledFor', { date: formatDate(item.scheduledAt, locale) })}`
                        : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {canManageAccess ? (
                    <select
                      aria-label={t('coreHr.offboarding.assetsAccess.status')}
                      value={item.status}
                      disabled={busy === item.id}
                      onChange={(e) => changeAccessStatus(item, e.target.value)}
                      className={selectClass}
                    >
                      {OFFBOARDING_ACCESS_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {t(`coreHr.offboarding.accessStatus.${s}`)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Badge tone={accessStatusTone(item.status)}>
                      {t(`coreHr.offboarding.accessStatus.${item.status}`, { defaultValue: item.status })}
                    </Badge>
                  )}
                  {canManageAccess ? (
                    <RemoveButton
                      label={t('coreHr.offboarding.assetsAccess.access.remove')}
                      disabled={busy === item.id}
                      onClick={() => setRemoveAccess(item)}
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
        {canManageAccess ? (
          addingAccess ? (
            <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TextField
                  label={t('coreHr.offboarding.assetsAccess.access.system')}
                  value={systemName}
                  onChange={(e) => setSystemName(e.target.value)}
                  maxLength={200}
                  required
                />
                <SelectField
                  label={t('coreHr.offboarding.assetsAccess.access.responsible')}
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  options={[
                    { value: '', label: t('coreHr.offboarding.checklist.unassigned') },
                    ...lookups.owners.map((o) => ({ value: o.id, label: o.name })),
                  ]}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" disabled={saving} onClick={() => setAddingAccess(false)}>
                  {t('common.actions.cancel')}
                </Button>
                <Button size="sm" disabled={saving || !systemName.trim()} onClick={() => void addAccess()}>
                  {saving ? t('common.loading') : t('coreHr.offboarding.assetsAccess.access.add')}
                </Button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setAddingAccess(true)} className="text-sm font-medium text-teal-700 hover:text-teal-900">
              + {t('coreHr.offboarding.assetsAccess.access.add')}
            </button>
          )
        ) : null}
      </Section>

      {/* Final settlement checklist */}
      {settlement.length > 0 ? (
        <Section title={t('coreHr.offboarding.assetsAccess.settlement.title')} count={settlement.length}>
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
            {settlement.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-dark-text">{item.title}</p>
                  <p className="text-xs text-gray-500">
                    {item.isRequired ? t('coreHr.offboarding.documents.required') : t('coreHr.offboarding.checklist.optional')}
                    {item.amount != null ? ` · ${item.currency ? formatMoney(item.amount, item.currency, locale) : item.amount}` : ''}
                  </p>
                </div>
                {canManageSettlement ? (
                  <select
                    aria-label={t('coreHr.offboarding.assetsAccess.status')}
                    value={item.status}
                    disabled={busy === item.id}
                    onChange={(e) => changeSettlementStatus(item, e.target.value)}
                    className={selectClass}
                  >
                    {OFFBOARDING_SETTLEMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {t(`coreHr.offboarding.settlementStatus.${s}`)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Badge tone={settlementStatusTone(item.status)}>
                    {t(`coreHr.offboarding.settlementStatus.${item.status}`, { defaultValue: item.status })}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <ReasonModal
        isOpen={!!waiveAsset}
        title={t('coreHr.offboarding.assetsAccess.assets.waiveTitle')}
        description={waiveAsset?.assetName}
        label={t('coreHr.offboarding.assetsAccess.assets.waiveReason')}
        confirmLabel={t('coreHr.offboarding.assetsAccess.assets.waive')}
        busy={!!waiveAsset && busy === waiveAsset.id}
        onClose={() => setWaiveAsset(null)}
        onConfirm={(reason) => {
          const a = waiveAsset;
          if (!a) return;
          void run(
            a.id,
            () => offboardingsApi.updateAssetStatus(offboardingId, a.id, { status: 'Waived', waiveReason: reason }),
            t('coreHr.offboarding.assetsAccess.assets.updateError'),
          ).then(() => setWaiveAsset(null));
        }}
      />

      <ConfirmModal
        isOpen={!!removeAsset}
        onClose={() => setRemoveAsset(null)}
        onConfirm={() => {
          const a = removeAsset;
          if (!a) return;
          void run(a.id, () => offboardingsApi.removeAsset(offboardingId, a.id), t('coreHr.offboarding.assetsAccess.assets.removeError')).then(
            () => setRemoveAsset(null),
          );
        }}
        tone="danger"
        busy={!!removeAsset && busy === removeAsset.id}
        title={t('coreHr.offboarding.assetsAccess.assets.removeTitle')}
        description={t('coreHr.offboarding.assetsAccess.assets.removeDescription', { name: removeAsset?.assetName ?? '' })}
        confirmLabel={t('coreHr.offboarding.assetsAccess.assets.remove')}
      />

      <ConfirmModal
        isOpen={!!removeAccess}
        onClose={() => setRemoveAccess(null)}
        onConfirm={() => {
          const item = removeAccess;
          if (!item) return;
          void run(item.id, () => offboardingsApi.removeAccess(offboardingId, item.id), t('coreHr.offboarding.assetsAccess.access.removeError')).then(
            () => setRemoveAccess(null),
          );
        }}
        tone="danger"
        busy={!!removeAccess && busy === removeAccess.id}
        title={t('coreHr.offboarding.assetsAccess.access.removeTitle')}
        description={t('coreHr.offboarding.assetsAccess.access.removeDescription', { name: removeAccess?.systemName ?? '' })}
        confirmLabel={t('coreHr.offboarding.assetsAccess.access.remove')}
      />
    </div>
  );
}
