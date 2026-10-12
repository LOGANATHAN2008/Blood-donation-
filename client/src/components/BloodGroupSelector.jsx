import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const ALL_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const INITIAL_VISIBLE = ['A+', 'A-', 'B+', 'B-'];

export default function BloodGroupSelector({ 
  value, 
  onChange, 
  label = "Blood Group", 
  required = false,
  error 
}) {
  const [expanded, setExpanded] = useState(false);

  // If the currently selected value is in the hidden list, we should probably expand by default
  // so the user sees their selection.
  const isSelectedHidden = value && !INITIAL_VISIBLE.includes(value);
  const showAll = expanded || isSelectedHidden;

  const visibleGroups = showAll ? ALL_BLOOD_GROUPS : INITIAL_VISIBLE;

  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {label} {!required && <span className="text-gray-400 font-normal">(Optional)</span>}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {visibleGroups.map((bg) => (
          <button
            key={bg}
            type="button"
            onClick={() => onChange(bg)}
            className={`
              h-10 px-4 rounded-full text-sm font-bold border transition-all duration-200 flex items-center justify-center
              ${value === bg 
                ? 'bg-brand-500 border-brand-500 text-white shadow-md transform scale-105' 
                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/20'
              }
            `}
          >
            {bg}
          </button>
        ))}
        
        {!showAll && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="h-10 px-4 rounded-full text-sm font-bold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all duration-200 flex items-center justify-center gap-1"
          >
            More <ChevronDown size={16} />
          </button>
        )}
        {expanded && !isSelectedHidden && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="h-10 px-4 rounded-full text-sm font-bold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all duration-200 flex items-center justify-center gap-1"
          >
            Less <ChevronUp size={16} />
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
