import { useTranslation } from 'react-i18next';
import PhoneDisplay from '../PhoneDisplay';
import SourcePill from './SourcePill';
import type { Candidate } from '../../types/candidates';

interface CandidatesMobileListProps {
  candidates: Candidate[];
  isLoading?: boolean;
  onCandidateClick?: (candidate: Candidate) => void;
}

export default function CandidatesMobileList({
  candidates,
  isLoading = false,
  onCandidateClick,
}: CandidatesMobileListProps) {
  const { t, i18n } = useTranslation();

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(i18n.language || 'en', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white rounded-xl border border-gray-200 animate-pulse" />
        ))}
      </div>
    );
  }

  if (candidates.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {candidates.map((c) => {
        const fullName = `${c.firstName || ''} ${c.lastName || ''}`.trim() || t('candidates.unknown');

        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onCandidateClick?.(c)}
            className="w-full text-left bg-white rounded-xl border border-gray-200 p-4 shadow-sm active:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-base font-semibold text-dark-text leading-snug">{fullName}</h3>
              {c.source ? <SourcePill source={c.source} className="shrink-0" /> : null}
            </div>

            {c.email && (
              <p className="text-sm text-gray-600 truncate mb-1">{c.email}</p>
            )}

            <div className="flex items-center justify-between gap-2 text-xs text-gray-500 mt-2">
              {c.phone ? (
                <PhoneDisplay phone={c.phone} className="text-xs text-gray-500" />
              ) : (
                <span>-</span>
              )}
              <span className="shrink-0">{c.createdAt ? formatDate(c.createdAt) : '-'}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
