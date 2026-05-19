import { useTranslation } from 'react-i18next';
import type { Candidate } from '../../types/candidates';
import SourcePill from './SourcePill';
import PhoneDisplay from '../PhoneDisplay';

interface CandidatesTableProps {
  candidates: Candidate[];
  isLoading?: boolean;
  onRowClick?: (candidate: Candidate) => void;
}

export default function CandidatesTable({ candidates, isLoading = false, onRowClick }: CandidatesTableProps) {
  const { t, i18n } = useTranslation();
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(i18n.language || 'en', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">{t('candidates.table.name')}</th>
            <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">{t('candidates.table.email')}</th>
            <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">{t('candidates.table.phone')}</th>
            <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">{t('candidates.table.source')}</th>
            <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">{t('candidates.table.created')}</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c) => {
            const fullName = `${c.firstName || ''} ${c.lastName || ''}`.trim() || t('candidates.unknown');
            return (
              <tr
                key={c.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onRowClick?.(c)}
              >
                <td className="py-4 px-6">
                  <span className="text-sm font-medium text-dark-text">{fullName}</span>
                </td>
                <td className="py-4 px-6">
                  <span className="text-sm text-gray-600">{c.email || '-'}</span>
                </td>
                <td className="py-4 px-6">
                  <PhoneDisplay phone={c.phone} className="text-sm text-gray-600" />
                </td>
                <td className="py-4 px-6">
                  {c.source ? <SourcePill source={c.source} /> : <span className="text-sm text-gray-600">-</span>}
                </td>
                <td className="py-4 px-6">
                  <span className="text-sm text-gray-600">{c.createdAt ? formatDate(c.createdAt) : '-'}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

