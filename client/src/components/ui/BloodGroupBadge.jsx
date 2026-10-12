const BLOOD_COLORS = {
  'A+':  { bg: 'bg-red-100 dark:bg-red-900/30',   border: 'border-red-400', text: 'text-red-700 dark:text-red-300' },
  'A-':  { bg: 'bg-red-50  dark:bg-red-900/20',   border: 'border-red-300', text: 'text-red-600 dark:text-red-400' },
  'B+':  { bg: 'bg-orange-100 dark:bg-orange-900/30', border: 'border-orange-400', text: 'text-orange-700 dark:text-orange-300' },
  'B-':  { bg: 'bg-orange-50  dark:bg-orange-900/20', border: 'border-orange-300', text: 'text-orange-600 dark:text-orange-400' },
  'O+':  { bg: 'bg-amber-100 dark:bg-amber-900/30',  border: 'border-amber-400',  text: 'text-amber-700 dark:text-amber-300' },
  'O-':  { bg: 'bg-yellow-100 dark:bg-yellow-900/30', border: 'border-yellow-400', text: 'text-yellow-700 dark:text-yellow-300' },
  'AB+': { bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-400', text: 'text-purple-700 dark:text-purple-300' },
  'AB-': { bg: 'bg-pink-100 dark:bg-pink-900/30',   border: 'border-pink-400',   text: 'text-pink-700 dark:text-pink-300' },
};

export default function BloodGroupBadge({ group, size = 'md' }) {
  const colors = BLOOD_COLORS[group] || { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-700' };
  const sizeClasses = size === 'lg' ? 'text-lg px-4 py-2' : size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  return (
    <span
      className={`blood-chip ${colors.bg} ${colors.border} ${colors.text} ${sizeClasses}`}
      aria-label={`Blood group ${group}`}
    >
      {group}
    </span>
  );
}
