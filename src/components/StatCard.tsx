interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  iconColor?: string;
}

export default function StatCard({ title, value, icon, iconColor = 'text-primary' }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-3xl font-bold text-dark-text mb-1">{value}</p>
          <p className="text-sm text-gray-600">{title}</p>
        </div>
        {icon && (
          <div className={`${iconColor} flex-shrink-0`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

