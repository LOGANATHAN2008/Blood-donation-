import { useState } from 'react';
import { Heart, Calendar } from 'lucide-react';
import { BLOOD_GROUPS } from '../../lib/constants';
import BloodGroupSelector from '../BloodGroupSelector';

export default function SettingsDonor({ data, mutate, isPending }) {
  const isDonor = !!data.donor;

  const [form, setForm] = useState({
    bloodGroup: data.donor?.bloodGroup || '',
    available: data.donor?.available ?? true,
    lastDonationDate: data.donor?.lastDonationDate ? data.donor.lastDonationDate.split('T')[0] : '',
    contactVisibility: data.donor?.contactVisibility || 'everyone',
    preferredDistance: data.donor?.preferredDistance || '25',
    nightWeekendAvail: data.donor?.nightWeekendAvail ?? false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setForm(f => ({ ...f, [name]: val }));
    mutate({ [name]: val });
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    mutate({ [name]: value });
  };

  const calculateNextDonation = () => {
    if (!form.lastDonationDate) return null;
    const next = new Date(form.lastDonationDate);
    next.setDate(next.getDate() + 90);
    return next;
  };

  const nextDonation = calculateNextDonation();
  const canDonateNow = nextDonation ? nextDonation <= new Date() : true;

  if (!isDonor) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto mb-4">
          <Heart size={28} />
        </div>
        <h2 className="text-xl font-bold mb-2">Not a Registered Donor</h2>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">You haven't registered as a blood donor yet. Registering allows you to save lives in your area.</p>
        <button className="btn-primary">Register as Donor</button>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 md:p-8 animate-fade-in space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-1">Donor Settings</h2>
        <p className="text-sm text-gray-500">Manage your availability, privacy, and donation history.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="sm:col-span-2">
          <BloodGroupSelector
            label="Blood Group"
            value={form.bloodGroup}
            onChange={v => handleChange({ target: { name: 'bloodGroup', value: v } })}
            required
          />
        </div>
        <div>
          <label className="label">Last Donation Date</label>
          <input type="date" className="input" name="lastDonationDate" value={form.lastDonationDate} onChange={handleChange} onBlur={handleBlur} max={new Date().toISOString().split('T')[0]} />
        </div>
      </div>

      {form.lastDonationDate && (
        <div className={`p-4 rounded-xl border ${canDonateNow ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'} flex items-center gap-3`}>
          <Calendar size={20} className={canDonateNow ? 'text-green-600' : 'text-amber-600'} />
          <div>
            <p className="font-bold text-sm">{canDonateNow ? 'You are eligible to donate!' : 'You are currently not eligible to donate.'}</p>
            <p className="text-xs opacity-80">Next eligible date: {nextDonation?.toLocaleDateString()}</p>
          </div>
        </div>
      )}

      <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-gray-800">
        <h3 className="font-bold text-lg">Availability & Matching</h3>
        
        <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
          <input type="checkbox" className="mt-1 w-5 h-5 rounded text-brand-600 focus:ring-brand-500" name="available" checked={form.available} onChange={handleChange} />
          <div>
            <p className="font-bold">Available Now</p>
            <p className="text-sm text-gray-500">Turn this off if you are temporarily unable to donate (e.g. sick, traveling).</p>
          </div>
        </label>

        <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
          <input type="checkbox" className="mt-1 w-5 h-5 rounded text-brand-600 focus:ring-brand-500" name="nightWeekendAvail" checked={form.nightWeekendAvail} onChange={handleChange} />
          <div>
            <p className="font-bold">Night & Weekend Emergencies</p>
            <p className="text-sm text-gray-500">Allow matching for critical requests during nights (9 PM - 6 AM) and weekends.</p>
          </div>
        </label>

        <div>
          <label className="label">Preferred Matching Distance</label>
          <select className="input" name="preferredDistance" value={form.preferredDistance} onChange={handleChange}>
            <option value="5">Within my City (5 km)</option>
            <option value="10">Within my District (10 km)</option>
            <option value="25">Nearby Districts (25 km)</option>
            <option value="state">Anywhere in my State (State-wide)</option>
          </select>
          <p className="text-xs text-gray-500 mt-2">Critical requests may bypass this if no donors are available nearby.</p>
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-gray-800">
        <h3 className="font-bold text-lg">Privacy</h3>
        <div>
          <label className="label">Contact Visibility</label>
          <select className="input" name="contactVisibility" value={form.contactVisibility} onChange={handleChange}>
            <option value="everyone">Everyone (Logged-in users)</option>
            <option value="approve">Approve each request</option>
            <option value="hidden">Hidden (I will contact them)</option>
          </select>
          <p className="text-xs text-gray-500 mt-2">Choose who can see your verified phone number when they need blood.</p>
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
