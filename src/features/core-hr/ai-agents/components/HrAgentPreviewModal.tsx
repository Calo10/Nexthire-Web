import { useTranslation } from 'react-i18next';
import Modal from '../../../../components/Modal';
import Button from '../../../../components/Button';
import type { HrAgentCatalogItem } from '../models/hrAgentCatalog';

type Props = {
  agent: HrAgentCatalogItem | null;
  isOpen: boolean;
  hired?: boolean;
  hiring?: boolean;
  onClose: () => void;
  onPrimary: () => void;
};

export default function HrAgentPreviewModal({
  agent,
  isOpen,
  hired = false,
  hiring = false,
  onClose,
  onPrimary,
}: Props) {
  const { t } = useTranslation();
  if (!agent) return null;

  const isFuture = agent.availability === 'future';
  const primaryLabel = hired
    ? t('coreHrAiAgents.badge.hired')
    : isFuture
      ? t('coreHrAiAgents.actions.comingSoon')
      : hiring
        ? t('coreHrAiAgents.actions.hiring')
        : t('coreHrAiAgents.actions.hire');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={agent.firstName}
      width="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            {t('coreHrAiAgents.actions.close')}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={hired || isFuture || hiring}
            onClick={onPrimary}
            className="!bg-gradient-to-r !from-teal-600 !to-emerald-500"
          >
            {primaryLabel}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className={`relative aspect-[5/3] rounded-xl overflow-hidden ${agent.avatarBg}`}>
          <img src={agent.avatar} alt="" className="w-full h-full object-cover object-top" />
        </div>
        <div>
          <p className="text-sm font-semibold text-teal-700">{t(`coreHrAiAgents.agents.${agent.id}.name`)}</p>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            {t(`coreHrAiAgents.agents.${agent.id}.summary`)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {t('coreHrAiAgents.catalog.bestFor')}
          </p>
          <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
            {t(`coreHrAiAgents.agents.${agent.id}.bestFor`)}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {agent.capabilities.map((cap) => (
            <span
              key={cap}
              className="inline-flex items-center rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-medium text-teal-800"
            >
              {t(`coreHrAiAgents.agents.${agent.id}.capabilities.${cap}`)}
            </span>
          ))}
        </div>
      </div>
    </Modal>
  );
}
