import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/Modal';
import Button from '../../../components/Button';
import { agentDetailPath, getAgentById, type AgentId } from '../models/agentCatalog';
import type { HiredAgentView } from '../models/agentHome';
import {
  AGENT_CORRELATION_EDGES,
  correlationEdgesFor,
  correlationSeatsFor,
  laterIso,
} from '../lib/agentCorrelation';
import AgentDailyStatusChat from './AgentDailyStatusChat';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  hired: HiredAgentView[];
};

type Seat = {
  id: AgentId;
  x: number;
  y: number;
  angle: number;
};

type TooltipState =
  | { kind: 'agent'; agentId: AgentId; x: number; y: number }
  | { kind: 'edge'; edgeId: string; x: number; y: number };

const VIEW = 520;
const CX = VIEW / 2;
const CY = VIEW / 2;
const TABLE_R = 78;
const SEAT_R = 178;
const NODE_R = 28;

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function formatHiredDate(iso: string | undefined, locale: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function edgePath(from: Seat, to: Seat): string {
  const midAngle = (from.angle + to.angle) / 2;
  const pull =
    Math.min(Math.abs(from.angle - to.angle), 360 - Math.abs(from.angle - to.angle)) > 120 ? 0.35 : 0.55;
  const ctrlR = TABLE_R + (SEAT_R - TABLE_R) * pull;
  const ctrl = polar(CX, CY, ctrlR, midAngle);
  return `M ${from.x} ${from.y} Q ${ctrl.x} ${ctrl.y} ${to.x} ${to.y}`;
}

function midPoint(from: Seat, to: Seat) {
  const midAngle = (from.angle + to.angle) / 2;
  const pull =
    Math.min(Math.abs(from.angle - to.angle), 360 - Math.abs(from.angle - to.angle)) > 120 ? 0.35 : 0.55;
  const ctrlR = TABLE_R + (SEAT_R - TABLE_R) * pull;
  const ctrl = polar(CX, CY, ctrlR, midAngle);
  return {
    x: 0.25 * from.x + 0.5 * ctrl.x + 0.25 * to.x,
    y: 0.25 * from.y + 0.5 * ctrl.y + 0.25 * to.y,
  };
}

export default function AgentCorrelationModal({ isOpen, onClose, hired }: Props) {
  const { t } = useTranslation();
  const [dailyOpen, setDailyOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) setDailyOpen(false);
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setDailyOpen(false);
        onClose();
      }}
      width={dailyOpen ? '2xl' : 'xl'}
      title={t('aiAgents.correlation.title')}
      subtitle={
        dailyOpen ? t('aiAgents.correlation.daily.modalSubtitle') : t('aiAgents.correlation.subtitle')
      }
    >
      {hired.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-gray-500">{t('aiAgents.correlation.empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-gray-500">
              {dailyOpen
                ? t('aiAgents.correlation.daily.layoutHint')
                : t('aiAgents.correlation.flowHint')}
            </p>
            <div className="flex items-center gap-2">
              {dailyOpen ? (
                <Button type="button" variant="secondary" size="sm" onClick={() => setDailyOpen(false)}>
                  {t('aiAgents.correlation.daily.back')}
                </Button>
              ) : null}
              <Button
                type="button"
                variant={dailyOpen ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setDailyOpen(true)}
                className="inline-flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                {t('aiAgents.correlation.daily.button')}
              </Button>
            </div>
          </div>

          {dailyOpen ? (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] gap-4 items-stretch min-h-[460px]">
              <AgentDailyStatusChat hired={hired} active={dailyOpen} />
              <RoundTableGraph hired={hired} compact onNavigateAway={onClose} />
            </div>
          ) : (
            <RoundTableGraph hired={hired} onNavigateAway={onClose} />
          )}
        </div>
      )}
    </Modal>
  );
}

function RoundTableGraph({
  hired,
  compact = false,
  onNavigateAway,
}: {
  hired: HiredAgentView[];
  compact?: boolean;
  onNavigateAway: () => void;
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [focusEdgeId, setFocusEdgeId] = useState<string | null>(null);
  const [focusAgentId, setFocusAgentId] = useState<AgentId | null>(null);
  const clipPrefix = compact ? 'c' : 'f';

  const hiredById = useMemo(() => new Map(hired.map((item) => [item.id, item])), [hired]);
  const seats = useMemo(() => {
    const ids = correlationSeatsFor(hired.map((item) => item.id));
    const n = Math.max(ids.length, 1);
    return ids.map((id, index): Seat => {
      const angle = (360 / n) * index;
      const pt = polar(CX, CY, SEAT_R, angle);
      return { id, x: pt.x, y: pt.y, angle };
    });
  }, [hired]);

  const seatById = useMemo(() => new Map(seats.map((s) => [s.id, s])), [seats]);
  const edges = useMemo(() => correlationEdgesFor(hired.map((item) => item.id)), [hired]);

  const relatedEdgeIds = useMemo(() => {
    if (!focusAgentId) return null;
    return new Set(
      edges.filter((e) => e.from === focusAgentId || e.to === focusAgentId).map((e) => e.id),
    );
  }, [edges, focusAgentId]);

  function showAgentTooltip(agentId: AgentId, clientX: number, clientY: number) {
    setFocusAgentId(agentId);
    setFocusEdgeId(null);
    setTooltip({ kind: 'agent', agentId, x: clientX, y: clientY });
  }

  function showEdgeTooltip(edgeId: string, clientX: number, clientY: number) {
    setFocusEdgeId(edgeId);
    setFocusAgentId(null);
    setTooltip({ kind: 'edge', edgeId, x: clientX, y: clientY });
  }

  function clearFocus() {
    setTooltip(null);
    setFocusEdgeId(null);
    setFocusAgentId(null);
  }

  return (
    <div
      className={`relative rounded-2xl border border-sky-100 bg-gradient-to-br from-[#F8FBFF] via-white to-[#F0F9FF] overflow-hidden h-full ${
        compact ? '' : ''
      }`}
      onMouseLeave={clearFocus}
    >
      <div className="absolute inset-0 opacity-[0.35] pointer-events-none" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 50%, rgba(0,119,230,0.08) 0%, transparent 55%)',
          }}
        />
      </div>

      <div
        className={`relative mx-auto w-full aspect-square ${compact ? 'max-w-[420px]' : 'max-w-[560px]'}`}
      >
        <svg
          viewBox={`0 0 ${VIEW} ${VIEW}`}
          className="w-full h-full"
          role="img"
          aria-label={t('aiAgents.correlation.title')}
        >
          <circle cx={CX} cy={CY} r={TABLE_R + 18} fill="#E0F2FE" opacity={0.55} />
          <circle cx={CX} cy={CY} r={TABLE_R} fill="#FFFFFF" stroke="#BAE6FD" strokeWidth={2} />
          <circle
            cx={CX}
            cy={CY}
            r={TABLE_R - 10}
            fill="none"
            stroke="#E0F2FE"
            strokeWidth={1}
            strokeDasharray="4 6"
          />
          <text
            x={CX}
            y={CY - 6}
            textAnchor="middle"
            className="fill-slate-500"
            style={{ fontSize: 11, fontWeight: 600 }}
          >
            {t('aiAgents.correlation.tableLabel')}
          </text>
          <text
            x={CX}
            y={CY + 10}
            textAnchor="middle"
            className="fill-slate-400"
            style={{ fontSize: 9 }}
          >
            {t('aiAgents.correlation.tableCount', { count: seats.length })}
          </text>

          {edges.map((edge) => {
            const from = seatById.get(edge.from);
            const to = seatById.get(edge.to);
            if (!from || !to) return null;
            const active =
              focusEdgeId === edge.id ||
              (relatedEdgeIds ? relatedEdgeIds.has(edge.id) : !focusEdgeId && !focusAgentId);
            const dimmed = (focusEdgeId || focusAgentId) && !active;
            const mid = midPoint(from, to);
            return (
              <g key={edge.id}>
                <path
                  d={edgePath(from, to)}
                  fill="none"
                  stroke={active ? '#0077E6' : '#CBD5E1'}
                  strokeWidth={active ? 2.5 : 1.5}
                  strokeOpacity={dimmed ? 0.2 : active ? 0.9 : 0.45}
                  strokeLinecap="round"
                  className="transition-all duration-150"
                  style={{ pointerEvents: 'stroke' }}
                  onMouseEnter={(e) => showEdgeTooltip(edge.id, e.clientX, e.clientY)}
                  onMouseMove={(e) => showEdgeTooltip(edge.id, e.clientX, e.clientY)}
                  onMouseLeave={clearFocus}
                />
                <circle
                  cx={mid.x}
                  cy={mid.y}
                  r={compact ? 5 : 7}
                  fill={active ? '#0077E6' : '#94A3B8'}
                  fillOpacity={dimmed ? 0.15 : active ? 0.95 : 0.55}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={(e) => showEdgeTooltip(edge.id, e.clientX, e.clientY)}
                  onMouseMove={(e) => showEdgeTooltip(edge.id, e.clientX, e.clientY)}
                  onMouseLeave={clearFocus}
                />
              </g>
            );
          })}

          {seats.map((seat) => {
            const agent = getAgentById(seat.id);
            const view = hiredById.get(seat.id);
            const connected =
              !focusAgentId && !focusEdgeId
                ? true
                : focusAgentId === seat.id ||
                  (focusEdgeId
                    ? edges.some(
                        (e) => e.id === focusEdgeId && (e.from === seat.id || e.to === seat.id),
                      )
                    : relatedEdgeIds
                      ? [...relatedEdgeIds].some((id) => {
                          const e = edges.find((edge) => edge.id === id);
                          return e && (e.from === seat.id || e.to === seat.id);
                        })
                      : false);
            const dimmed = (focusAgentId || focusEdgeId) && !connected;
            const hiredLabel = formatHiredDate(view?.hiredAt, i18n.language);
            const clipId = `${clipPrefix}-${seat.id}`;

            return (
              <g
                key={seat.id}
                className="cursor-pointer"
                opacity={dimmed ? 0.28 : 1}
                onMouseEnter={(e) => showAgentTooltip(seat.id, e.clientX, e.clientY)}
                onMouseMove={(e) => showAgentTooltip(seat.id, e.clientX, e.clientY)}
                onMouseLeave={clearFocus}
                onClick={() => {
                  onNavigateAway();
                  navigate(agentDetailPath(seat.id));
                }}
              >
                <circle
                  cx={seat.x}
                  cy={seat.y}
                  r={NODE_R + 4}
                  fill="#FFFFFF"
                  stroke={
                    connected && (focusAgentId === seat.id || focusEdgeId) ? '#0077E6' : '#E2E8F0'
                  }
                  strokeWidth={2}
                />
                <clipPath id={clipId}>
                  <circle cx={seat.x} cy={seat.y} r={NODE_R} />
                </clipPath>
                <image
                  href={agent.avatar}
                  x={seat.x - NODE_R}
                  y={seat.y - NODE_R}
                  width={NODE_R * 2}
                  height={NODE_R * 2}
                  clipPath={`url(#${clipId})`}
                  preserveAspectRatio="xMidYMin slice"
                />
                <text
                  x={seat.x}
                  y={seat.y + NODE_R + 14}
                  textAnchor="middle"
                  className="fill-slate-800"
                  style={{ fontSize: compact ? 10 : 11, fontWeight: 600 }}
                >
                  {agent.firstName}
                </text>
                <text
                  x={seat.x}
                  y={seat.y + NODE_R + 26}
                  textAnchor="middle"
                  className="fill-slate-400"
                  style={{ fontSize: 9 }}
                >
                  {hiredLabel}
                </text>
              </g>
            );
          })}
        </svg>

        {tooltip ? (
          <CorrelationTooltip tooltip={tooltip} hiredById={hiredById} locale={i18n.language} />
        ) : null}
      </div>

      {!compact && edges.length === 0 ? (
        <p className="relative px-4 pb-3 text-center text-sm text-gray-500">
          {t('aiAgents.correlation.noEdges')}
        </p>
      ) : null}
    </div>
  );
}

function CorrelationTooltip({
  tooltip,
  hiredById,
  locale,
}: {
  tooltip: TooltipState;
  hiredById: Map<AgentId, HiredAgentView>;
  locale: string;
}) {
  const { t } = useTranslation();

  const style: CSSProperties = {
    position: 'fixed',
    left: Math.min(tooltip.x + 14, window.innerWidth - 280),
    top: Math.min(tooltip.y + 14, window.innerHeight - 180),
    zIndex: 80,
  };

  if (tooltip.kind === 'agent') {
    const agent = getAgentById(tooltip.agentId);
    const view = hiredById.get(tooltip.agentId);
    return (
      <div
        style={style}
        className="pointer-events-none w-[250px] rounded-xl border border-slate-200 bg-white shadow-xl p-3"
      >
        <div className="flex items-center gap-2.5">
          <img
            src={agent.avatar}
            alt=""
            className={`w-9 h-9 rounded-full object-cover object-top ${agent.avatarBg}`}
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-dark-text leading-tight">{agent.firstName}</p>
            <p className="text-[11px] text-gray-500 truncate">{t(`aiAgents.agents.${agent.id}.name`)}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-600 leading-relaxed">
          {t(`aiAgents.agents.${agent.id}.summary`)}
        </p>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500">
          <span>
            {t('aiAgents.correlation.hiredOn', {
              date: formatHiredDate(view?.hiredAt, locale),
            })}
          </span>
          {view?.status ? (
            <span className="text-emerald-600 font-medium">
              {t(`aiAgents.home.status.${view.status}`)}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-[10px] text-[#0077E6] font-medium">{t('aiAgents.correlation.openAgent')}</p>
      </div>
    );
  }

  const edge = AGENT_CORRELATION_EDGES.find((e) => e.id === tooltip.edgeId);
  if (!edge) return null;
  const from = getAgentById(edge.from);
  const to = getAgentById(edge.to);
  const fromView = hiredById.get(edge.from);
  const toView = hiredById.get(edge.to);
  const since = laterIso(fromView?.hiredAt, toView?.hiredAt);

  return (
    <div
      style={style}
      className="pointer-events-none w-[270px] rounded-xl border border-slate-200 bg-white shadow-xl p-3"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#0077E6]">
        {t('aiAgents.correlation.relation')}
      </p>
      <p className="mt-1 text-sm font-semibold text-dark-text">
        {from.firstName} → {to.firstName}
      </p>
      <p className="mt-1.5 text-xs text-gray-600 leading-relaxed">
        {t(`aiAgents.correlation.edges.${edge.labelKey}`)}
      </p>
      <p className="mt-2 text-[11px] text-gray-500">
        {t('aiAgents.correlation.activeSince', {
          date: formatHiredDate(since ?? undefined, locale),
        })}
      </p>
      <div className="mt-2 flex items-center gap-3 text-[10px] text-gray-400">
        <span>
          {from.firstName}: {formatHiredDate(fromView?.hiredAt, locale)}
        </span>
        <span>
          {to.firstName}: {formatHiredDate(toView?.hiredAt, locale)}
        </span>
      </div>
    </div>
  );
}
