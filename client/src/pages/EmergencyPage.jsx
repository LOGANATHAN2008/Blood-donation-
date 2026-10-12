import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, Phone, MapPin, ShieldAlert, HeartPulse, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { BLOOD_GROUPS } from '../lib/constants';
import LocationSelect from '../components/LocationSelect';
import BloodGroupSelector from '../components/BloodGroupSelector';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function EmergencyPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    patientName: '',
    bloodGroup: '',
    units: 1,
    hospital: '',
    state: '',
    district: '',
    city: '',
    emergencyTimeWindow: '',
    contactName: '',
    contactPhone: '',
    note: '',
  });
  const [declaration, setDeclaration] = useState(false);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      let neededBy = new Date();
      if (data.emergencyTimeWindow === '2_hours') {
        neededBy = new Date(Date.now() + 2 * 60 * 60 * 1000);
      } else if (data.emergencyTimeWindow === '12_hours') {
        neededBy = new Date(Date.now() + 12 * 60 * 60 * 1000);
      } else if (data.emergencyTimeWindow === 'tomorrow') {
        neededBy = new Date(Date.now() + 24 * 60 * 60 * 1000);
      } else {
        throw new Error('Please select when blood is needed');
      }

      const payload = {
        ...data,
        urgency: 'Critical',
        isEmergency: true,
        neededBy: neededBy.toISOString(),
      };
      
      const res = await api.post('/requests', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Emergency request posted successfully! Donors will be notified.', { duration: 5000 });
      qc.invalidateQueries({ queryKey: ['requests'] });
      qc.invalidateQueries({ queryKey: ['myRequests'] });
      navigate('/profile'); // Redirect to profile to see the request
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to post an emergency request.');
      navigate('/auth');
      return;
    }
    if (!declaration) {
      toast.error('You must confirm this is a genuine emergency.');
      return;
    }
    createMutation.mutate(form);
  };

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-b from-red-50 to-white dark:from-red-950/20 dark:to-surface-dark animate-fade-in">
      {/* Hero Section */}
      <div className="bg-red-600 dark:bg-red-700 text-white pt-10 pb-16 px-4 rounded-b-[40px] shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-white text-red-600 flex items-center justify-center animate-pulse shadow-xl">
              <AlertTriangle size={28} className="fill-current" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Blood Emergency</h1>
          </div>
          <p className="text-red-100 text-lg max-w-2xl font-medium">
            Post an emergency blood request. Our system will instantly alert compatible donors in your district via SMS and Push Notifications.
          </p>
          
          <div className="flex flex-wrap gap-3 mt-6">
            <a href="tel:112" className="bg-white/20 hover:bg-white/30 backdrop-blur border border-white/30 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
              <Phone size={16} /> Call 112
            </a>
            <a href="tel:108" className="bg-white/20 hover:bg-white/30 backdrop-blur border border-white/30 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
              <HeartPulse size={16} /> Ambulance (108)
            </a>
            <a href="https://eraktkosh.mohfw.gov.in/eraktkoshPortal/#/" target="_blank" rel="noopener noreferrer" className="bg-white/20 hover:bg-white/30 backdrop-blur border border-white/30 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
              <ExternalLink size={16} /> eRaktKosh Banks
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-10 relative z-20">
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Main Form */}
          <div className="md:col-span-2 glass-card p-6 md:p-8 shadow-xl border-t-4 border-t-red-500">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <HeartPulse className="text-red-500" /> Post Emergency Request
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="label">Patient Name</label>
                  <input className="input" placeholder="Name of patient" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} required />
                </div>
                <div className="sm:col-span-2">
                  <BloodGroupSelector
                    label="Blood Group Needed"
                    value={form.bloodGroup}
                    onChange={v => setForm(f => ({ ...f, bloodGroup: v }))}
                    required
                  />
                </div>

                <div>
                  <label className="label">Units Required (Max 10)</label>
                  <input type="number" min="1" max="10" className="input" value={form.units} onChange={e => setForm(f => ({ ...f, units: Number(e.target.value) }))} required />
                </div>
                <div>
                  <label className="label">When is it needed?</label>
                  <select className="input border-red-200 focus:border-red-500 focus:ring-red-500" value={form.emergencyTimeWindow} onChange={e => setForm(f => ({ ...f, emergencyTimeWindow: e.target.value }))} required>
                    <option value="">Select urgency</option>
                    <option value="2_hours">Immediately (within 2 hours)</option>
                    <option value="12_hours">Today (within 12 hours)</option>
                    <option value="tomorrow">Tomorrow (within 24 hours)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="label">Hospital Name</label>
                  <input className="input" placeholder="Admitted hospital" value={form.hospital} onChange={e => setForm(f => ({ ...f, hospital: e.target.value }))} required />
                </div>
                <div className="md:col-span-2 space-y-4">
                  <label className="label text-red-950/70 dark:text-red-200/70 font-medium flex items-center gap-2">
                    <MapPin size={16} /> Location Details
                  </label>
                  
                  <LocationSelect
                    state={form.state}
                    setState={(s) => setForm(f => ({ ...f, state: s, district: '' }))}
                    district={form.district}
                    setDistrict={(d) => setForm(f => ({ ...f, district: d }))}
                    city={form.city}
                    setCity={(c) => setForm(f => ({ ...f, city: c }))}
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800 pt-5 mt-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="label">Contact Person (Attender)</label>
                    <input className="input" placeholder="Your name" value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="label">Contact Phone</label>
                    <input type="tel" className="input font-mono" placeholder="10-digit mobile number" value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} required />
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Additional Details (Optional)</label>
                <textarea className="input min-h-[80px]" placeholder="Any specific requirements or room number..." value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800 flex gap-3 items-start mt-6">
                <input 
                  type="checkbox" 
                  id="declaration" 
                  className="mt-1 w-5 h-5 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                  checked={declaration}
                  onChange={e => setDeclaration(e.target.checked)}
                />
                <label htmlFor="declaration" className="text-sm font-medium text-red-900 dark:text-red-300 cursor-pointer">
                  I declare this is a genuine medical emergency. I understand that posting false emergency requests will lead to permanent account suspension.
                </label>
              </div>

              <button 
                type="submit" 
                className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 transition-transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Posting Emergency...' : (
                  <>
                    <AlertTriangle size={20} className="animate-pulse" /> Post Emergency Request
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="glass-card p-5 border-t-4 border-t-brand-500">
              <h3 className="font-bold flex items-center gap-2 mb-3">
                <ShieldAlert className="text-brand-500" size={20} /> Do's & Don'ts
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex gap-2">✅ <strong>Do:</strong> Provide the exact hospital name and city area.</li>
                <li className="flex gap-2">✅ <strong>Do:</strong> Keep your phone ready to receive calls from donors.</li>
                <li className="flex gap-2">✅ <strong>Do:</strong> Arrange for a blood sample for cross-matching.</li>
                <li className="flex gap-2 text-red-600 dark:text-red-400">❌ <strong>Don't:</strong> Post fake requests.</li>
                <li className="flex gap-2 text-red-600 dark:text-red-400">❌ <strong>Don't:</strong> Pay money for blood. Blood donation is purely voluntary.</li>
              </ul>
            </div>

            <div className="glass-card p-5 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900">
              <h3 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-2">
                Hospital Blood Bank
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Always contact the hospital's internal blood bank directly first. They can often arrange blood through their network faster.
              </p>
            </div>

            <Link to="/donors" className="glass-card p-5 block hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold mb-1 group-hover:text-brand-500 transition-colors">Search Donors Directly</h3>
                  <p className="text-xs text-gray-500">Browse registered donors in your area and contact them.</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-600">
                  →
                </div>
              </div>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
