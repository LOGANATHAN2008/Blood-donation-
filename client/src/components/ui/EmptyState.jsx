import { PackageOpen, UserX, Droplets, Hospital, Pill } from 'lucide-react';

const ICONS = {
  donors: UserX,
  requests: Droplets,
  medicines: Pill,
  hospitals: Hospital,
  default: PackageOpen,
};

export default function EmptyState({ type = 'default', title, message, action }) {
  const Icon = ICONS[type] || ICONS.default;
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4">
      <div className="p-6 rounded-full bg-brand-50 dark:bg-brand-900/20">
        <Icon className="text-brand-400 dark:text-brand-500" size={40} strokeWidth={1.5} />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">{title || 'Nothing here yet'}</h3>
        {message && <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">{message}</p>}
      </div>
      {action}
    </div>
  );
}
