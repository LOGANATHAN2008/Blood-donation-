import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Calendar, MapPin, Phone, ShieldCheck, CheckCircle2, ChevronRight, X, Camera, Loader2, Sparkles } from 'lucide-react';
import LocationSelect from '../LocationSelect';

export default function ProfileCompletionPopup({ isOpen, onClose }) {
  const { dbUser, refreshDbUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [form, setForm] = useState({
    name: '',
    dob: '',
    gender: '',
    state: '',
    district: '',
    city: '',
    photoUrl: '',
    photoId: '',
    phone: '',
  });

  const initializedRef = useRef(false);

  // Initialize form with existing data only when opening or when user data is ready
  useEffect(() => {
    if (isOpen && dbUser && !initializedRef.current) {
      setForm({
        name: dbUser.name || '',
        dob: dbUser.dob ? dbUser.dob.split('T')[0] : '',
        gender: dbUser.gender || '',
        state: dbUser.state || '',
        district: dbUser.district || '',
        city: dbUser.city || '',
        photoUrl: dbUser.photoUrl || '',
        photoId: dbUser.photoId || '',
        phone: dbUser.phone || dbUser.verifiedPhone || '',
      });
      initializedRef.current = true;
    }
    if (!isOpen) {
      initializedRef.current = false;
    }
  }, [isOpen, dbUser]);

  // Memoized handlers to prevent ANY re-render lag or recreation
  const handleFieldChange = useCallback((field) => (e) => {
    const val = e.target.value;
    setForm(prev => (prev[field] === val ? prev : { ...prev, [field]: val }));
  }, []);

  const handlePhoneChange = useCallback((e) => {
    const cleanDigits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setForm(prev => (prev.phone === cleanDigits ? prev : { ...prev, phone: cleanDigits }));
  }, []);

  const handleStateChange = useCallback((s) => {
    setForm(prev => ({ ...prev, state: s, district: '' }));
  }, []);

  const handleDistrictChange = useCallback((d) => {
    setForm(prev => ({ ...prev, district: d }));
  }, []);

  const handleReverseGeocode = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    const toastId = toast.loading('Finding your location...');
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const res = await api.get(`/locations/reverse?lat=${latitude}&lng=${longitude}`);
        if (res.data.status === 'success') {
          const { state, district, city } = res.data.data;
          setForm(prev => ({ ...prev, state, district, city }));
          toast.success('Location found!', { id: toastId });
        }
      } catch (err) {
        toast.error('Could not determine location. Please select manually.', { id: toastId });
      }
    }, () => {
      toast.error('Location permission denied.', { id: toastId });
    });
  }, []);

  const handleImageUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 300 * 1024) {
      toast.error('Image must be less than 300KB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'blood blank');
    formData.append('cloud_name', 'dxsa93rr2');

    setUploadingImage(true);
    const toastId = toast.loading('Uploading profile picture...');
    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dxsa93rr2/image/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        setForm(prev => ({ ...prev, photoUrl: data.secure_url, photoId: data.public_id }));
        toast.success('Picture uploaded!', { id: toastId });
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setUploadingImage(false);
    }
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const cleanPhone = form.phone?.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    
    // Clean empty strings so they don't break backend Zod validation
    const payload = { ...form, phone: cleanPhone };
    Object.keys(payload).forEach(key => {
      if (payload[key] === '' || payload[key] === null || payload[key] === undefined) {
        delete payload[key];
      }
    });

    try {
      await api.patch('/me/onboarding', payload);
      if (dbUser?.uid) {
        localStorage.setItem(`profile_completed_${dbUser.uid}`, 'true');
      }
      await refreshDbUser();
      toast.success('Profile completed successfully!');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  }, [form, dbUser, refreshDbUser, onClose]);

  // Dynamic real-time calculation of completed fields
  const hasName = Boolean(form.name && form.name.trim().length > 0);
  const hasDob = Boolean(form.dob);
  const hasGender = Boolean(form.gender);
  const hasPhone = Boolean(form.phone && form.phone.replace(/\D/g, '').length === 10);

  const completedFields = [hasName, hasDob, hasGender, hasPhone].filter(Boolean).length;
  const totalFields = 4;
  const progressPercent = Math.round((completedFields / totalFields) * 100);

  const isGoogleLinked = dbUser?.providers?.includes('google') || (dbUser?.email && dbUser?.name);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm" 
        role="dialog" 
        aria-modal="true"
      >
        <motion.div 
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white dark:bg-[#1a1f2c] w-full sm:max-w-lg rounded-t-[28px] sm:rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-200/70 dark:border-gray-800/80"
        >
          {/* iOS Grabber for Mobile Bottom Sheet */}
          <div className="pt-2.5 pb-1 flex justify-center sm:hidden">
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>

          {/* iOS Header */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800/80 bg-white/90 dark:bg-[#1a1f2c]/90 backdrop-blur-lg sticky top-0 z-10">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                  Complete your profile
                </h2>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                  {completedFields} of {totalFields} details completed
                </p>
              </div>
              <button 
                type="button"
                onClick={onClose} 
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors"
                aria-label="Close"
              >
                <X size={16} strokeWidth={2.2} />
              </button>
            </div>

            {/* iOS Smooth Progress Bar */}
            <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden mt-3">
              <div 
                className="h-full bg-brand-600 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Form Content - Smooth iOS Scroll, No Desktop Scrollbar */}
          <div className="px-6 py-5 overflow-y-auto scrollbar-hide flex-1 space-y-5">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center justify-center pt-1">
              <div className="relative group">
                <div className={`w-24 h-24 rounded-full border-2 border-brand-100 dark:border-brand-900/40 shadow-sm overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center ${uploadingImage ? 'opacity-50' : ''}`}>
                  {form.photoUrl ? (
                    <img src={form.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={40} className="text-gray-400 dark:text-gray-500" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-2 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white rounded-full cursor-pointer shadow-md transition-all z-10">
                  {uploadingImage ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
                  <input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                </label>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 font-medium">Optional &middot; Max 300KB</p>
            </div>

            <form id="profile-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="label text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                {isGoogleLinked && dbUser?.name ? (
                  <div className="flex items-center justify-between p-3 bg-brand-50/70 dark:bg-brand-950/20 rounded-xl border border-brand-200/50 dark:border-brand-900/40">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 size={18} className="text-brand-600 shrink-0" />
                      <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{form.name}</span>
                    </div>
                    <span className="text-[11px] font-medium text-brand-600 dark:text-brand-400 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full border border-brand-100 dark:border-brand-900/60 shadow-2xs">
                      from Google
                    </span>
                  </div>
                ) : (
                  <input 
                    type="text" 
                    className="input text-base" 
                    value={form.name} 
                    onChange={handleFieldChange('name')} 
                    required 
                    placeholder="Enter your full name" 
                  />
                )}
              </div>

              {/* DOB & Gender */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="date" 
                    className="input text-base" 
                    value={form.dob} 
                    onChange={handleFieldChange('dob')} 
                    required 
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Must be at least 13 yrs old</p>
                </div>
                <div>
                  <label className="label text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select 
                    className="input text-base" 
                    value={form.gender} 
                    onChange={handleFieldChange('gender')} 
                    required
                  >
                    <option value="" disabled>Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              {/* Mobile Number - Ultra Fast, Zero Lag Input */}
              <div>
                <label className="label text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 flex items-center gap-1 text-gray-500 dark:text-gray-400 font-semibold text-sm select-none pointer-events-none">
                    <span>+91</span>
                    <span className="w-px h-4 bg-gray-200 dark:bg-gray-700 ml-1.5" />
                  </div>
                  <input 
                    type="tel" 
                    inputMode="numeric"
                    autoComplete="tel"
                    className="input pl-14 text-base font-medium tracking-wide" 
                    placeholder="98765 43210" 
                    value={form.phone} 
                    onChange={handlePhoneChange} 
                    maxLength={10}
                    required
                  />
                  {form.phone && form.phone.length === 10 && (
                    <div className="absolute right-3.5 text-emerald-500 pointer-events-none">
                      <CheckCircle2 size={18} />
                    </div>
                  )}
                </div>
              </div>

              {/* Location Section */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label text-xs uppercase tracking-wider text-gray-500 font-semibold mb-0">
                    Location <span className="text-gray-400 font-normal normal-case">(Optional)</span>
                  </label>
                  <button 
                    type="button" 
                    onClick={handleReverseGeocode} 
                    className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-medium active:opacity-75 transition-opacity"
                  >
                    <MapPin size={12} /> Use Live Location
                  </button>
                </div>
                
                <LocationSelect 
                  state={form.state}
                  setState={handleStateChange}
                  district={form.district}
                  setDistrict={handleDistrictChange}
                  hideCity={true}
                  disableAutoLoad={true}
                />
                
                <input 
                  type="text" 
                  className="input mt-3 text-base" 
                  placeholder="City / Area" 
                  value={form.city} 
                  onChange={handleFieldChange('city')} 
                />
              </div>
            </form>
          </div>

          {/* iOS Bottom Action Bar */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800/80 bg-gray-50/80 dark:bg-[#151922] flex items-center justify-end">
            <button 
              form="profile-form" 
              type="submit" 
              disabled={loading || (form.phone && form.phone.length !== 10)} 
              className="btn-primary w-full sm:w-auto sm:min-w-[160px] h-11 rounded-xl text-base font-semibold shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                'Save & Continue'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
