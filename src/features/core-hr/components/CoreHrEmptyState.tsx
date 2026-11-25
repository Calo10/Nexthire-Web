type CoreHrEmptyStateProps = {
  title: string;
  description: string;
};

export default function CoreHrEmptyState({ title, description }: CoreHrEmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-700">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </div>
      <h2 className="text-base font-semibold text-dark-text">{title}</h2>
      <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">{description}</p>
    </div>
  );
}
