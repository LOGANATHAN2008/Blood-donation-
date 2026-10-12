import { useState, useRef, useEffect } from 'react';
import { Camera, BadgeCheck } from 'lucide-react';
import LocationSelect from '../LocationSelect';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function SettingsProfile({ data, mutate, isPending }) {
  const [form, setForm] = useState({
    name: data.user.name || '',
    state: data.user.state || '',
    district: data.user.district || '',
    city: data.user.city || '',
    gender: data.user.gender || '',
    dob: data.user.dob ? data.user.dob.split('T')[0] : '',
    phone: data.user.phone || data.user.verifiedPhone || '',
  });

  const [photoUrl, setPhotoUrl] = useState(data.user.photoUrl);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (data?.user) {
      setForm(prev => ({
        ...prev,
        name: data.user.name || '',
        state: data.user.state || '',
        district: data.user.district || '',
        city: data.user.city || '',
        gender: data.user.gender || '',
        dob: data.user.dob ? data.user.dob.split('T')[0] : '',
        phone: data.user.phone || data.user.verifiedPhone || prev.phone || '',
      }));
      setPhotoUrl(data.user.photoUrl);
    }
  }, [data.user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleBlur = (field) => {
    if (field === 'phone') {
      const cleanPhone = form.phone.replace(/\D/g, '').slice(0, 10);
      if (cleanPhone && cleanPhone.length !== 10) {
        toast.error('Mobile number must be 10 digits');
        return;
      }
      mutate({ phone: cleanPhone });
    } else {
      mutate(form);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const toastId = toast.loading('Uploading photo...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'blood blank');
      formData.append('folder', 'profiles');

      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dxsa93rr2';
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const uploadData = await res.json();
      
      if (uploadData.secure_url) {
        setPhotoUrl(uploadData.secure_url);
        mutate({ photoUrl: uploadData.secure_url, photoId: uploadData.public_id });
        toast.success('Photo updated!', { id: toastId });
      } else {
        throw new Error(uploadData.error?.message || 'Upload failed');
      }
    } catch (err) {
      toast.error(err.message, { id: toastId });
    }
  };

  const currentPhone = data.user.phone || data.user.verifiedPhone || form.phone;

  return (
    <div className="glass-card p-6 md:p-8 animate-fade-in space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-1">Profile Information</h2>
        <p className="text-sm text-gray-500">Update your personal details and public profile.</p>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-brand-100 dark:bg-brand-900/50 border-4 border-white dark:border-gray-800 shadow-xl overflow-hidden flex items-center justify-center text-3xl font-black text-brand-500">
            {photoUrl ? <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" /> : form.name[0]?.toUpperCase()}
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-lg hover:bg-brand-600 transition-colors"
          >
            <Camera size={16} />
          </button>
          <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handlePhotoUpload} />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg">{form.name}</h3>
            {currentPhone && <BadgeCheck size={16} className="text-green-500" title="Phone Added" />}
          </div>
          <p className="text-sm text-gray-500">{data.user.email}</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
            {currentPhone ? (currentPhone.startsWith('+91') ? currentPhone : `+91 ${currentPhone}`) : 'No phone added'}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="label">Full Name</label>
          <input className="input" name="name" value={form.name} onChange={handleChange} onBlur={() => handleBlur('name')} />
        </div>
        <div>
          <label className="label">Mobile Number</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold select-none">+91</span>
            <input 
              type="tel"
              className="input pl-12 font-medium" 
              name="phone" 
              value={form.phone} 
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                setForm(f => ({ ...f, phone: val }));
              }} 
              onBlur={() => handleBlur('phone')} 
              placeholder="9876543210"
              maxLength={10}
            />
          </div>
        </div>
        <div>
          <label className="label">Date of Birth</label>
          <input type="date" className="input" name="dob" value={form.dob} onChange={handleChange} onBlur={() => handleBlur('dob')} max={new Date().toISOString().split('T')[0]} />
        </div>
        
        <div>
          <label className="label">Gender (Optional)</label>
          <select className="input" name="gender" value={form.gender} onChange={handleChange} onBlur={() => handleBlur('gender')}>
            <option value="">Prefer not to say</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="label">Location</label>
          <div className="flex flex-col sm:flex-row gap-4 mt-1">
            <LocationSelect
              state={form.state}
              setState={(v) => { setForm(f => ({ ...f, state: v, district: '' })); mutate({ state: v, district: '' }); }}
              district={form.district}
              setDistrict={(v) => { setForm(f => ({ ...f, district: v })); mutate({ district: v }); }}
              city={form.city}
              setCity={(v) => { setForm(f => ({ ...f, city: v })); mutate({ city: v }); }}
            />
          </div>
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
