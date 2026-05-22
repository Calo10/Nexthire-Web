import { ReactNode } from 'react';
import Card from './Card';

interface ChartCardProps {
  title: string;
  children: ReactNode;
  isLoading?: boolean;
  error?: string | null;
}

export default function ChartCard({ title, children, error }: ChartCardProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-dark-text mb-4">{title}</h3>
      {error ? (
        <div className="h-64 flex items-center justify-center text-red-600">
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        children
      )}
    </Card>
  );
}
