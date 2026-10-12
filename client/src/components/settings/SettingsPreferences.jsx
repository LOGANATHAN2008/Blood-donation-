import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useLang } from '../../context/LangContext';

export default function SettingsPreferences({ data, mutate, isPending }) {
  const { dark, toggle } = useTheme();
  const { lang, switchLang } = useLang();
  
  const [form, setForm] = useState({
    language: data.user.language || 'en',
    theme: data.user.theme || 'system',
    textSize: data.user.textSize || 'medium',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    mutate({ [name]: value });

    if (name === 'theme') {
      if (value === 'dark' && !dark) toggle();
      if (value === 'light' && dark) toggle();
      // 'system' logic is handled in ThemeContext generally, but toggling forces a switch
    }
    if (name === 'language') {
      switchLang(value);
    }
  };

  return (
    <div className="glass-card p-6 md:p-8 animate-fade-in space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-1">App Preferences</h2>
        <p className="text-sm text-gray-500">Customize how Life Connect looks and feels.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="label">Language</label>
          <select className="input" name="language" value={form.language} onChange={handleChange}>
            <option value="en">English</option>
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="te">తెలుగు (Telugu)</option>
            <option value="ml">മലയാളം (Malayalam)</option>
            <option value="kn">ಕನ್ನಡ (Kannada)</option>
          </select>
        </div>

        <div>
          <label className="label">Theme</label>
          <select className="input" name="theme" value={form.theme} onChange={handleChange}>
            <option value="system">System Default</option>
            <option value="light">Light Mode</option>
            <option value="dark">Dark Mode</option>
          </select>
        </div>

        <div>
          <label className="label">Text Size</label>
          <select className="input" name="textSize" value={form.textSize} onChange={handleChange}>
            <option value="small">Small</option>
            <option value="medium">Medium (Default)</option>
            <option value="large">Large</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
        <span className="text-xs text-gray-400 flex items-center gap-2">
          {isPending ? <span className="animate-pulse">Saving changes...</span> : 'All changes are automatically saved.'}
        </span>
      </div>
    </div>
  );
}
