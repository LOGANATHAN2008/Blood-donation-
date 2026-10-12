import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';

export default function MyActivitySection() {
  const { token, user } = useAuth();
  const { t } = useLang();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    bloodGroup: 'O+',
    hospital: '',
    campTitle: '',
    units: 1,
    notes: ''
  });

  const fetchRecords = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/donations/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setRecords(json || []);
      }
    } catch (err) {
      console.error('Failed to fetch donation records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const url = editingRecord ? `/api/donations/${editingRecord._id}` : '/api/donations';
      const method = editingRecord ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success(editingRecord ? 'Record updated!' : 'Donation record submitted for verification!');
        setShowModal(false);
        setEditingRecord(null);
        setFormData({
          date: new Date().toISOString().split('T')[0],
          bloodGroup: 'O+',
          hospital: '',
          campTitle: '',
          units: 1,
          notes: ''
        });
        fetchRecords();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to submit record.');
      }
    } catch (err) {
      toast.error('Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      const res = await fetch(`/api/donations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Record deleted.');
        fetchRecords();
      }
    } catch {
      toast.error('Delete failed.');
    }
  };

  const handleDownloadCert = async (recordId, certId) => {
    try {
      toast.loading('Generating official certificate...', { id: 'cert-download' });
      const res = await fetch(`/api/donations/${recordId}/certificate`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Donation_Certificate_${certId || 'LC'}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Certificate downloaded!', { id: 'cert-download' });
      } else {
        toast.error('Failed to download certificate.', { id: 'cert-download' });
      }
    } catch {
      toast.error('Error generating PDF.', { id: 'cert-download' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
            <span>🩸</span>
            <span>{t('myActivity')}</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Log your blood donations. Once verified by coordinators, they unlock badges, leaderboard rank, and official certificates.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingRecord(null);
            setShowModal(true);
          }}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 text-white font-bold text-xs shadow-md transition"
        >
          + {t('logDonation')}
        </button>
      </div>

      {/* Record list */}
      {loading ? (
        <div className="py-6 text-center text-xs text-gray-400">Loading donation activity...</div>
      ) : records.length === 0 ? (
        <div className="py-8 text-center rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 mb-2">No blood donation records logged yet.</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline"
          >
            Log your first donation to earn the First Drop badge!
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((r) => (
            <div
              key={r._id}
              className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-black text-sm text-gray-900 dark:text-white">
                    {new Date(r.date).toLocaleDateString()}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 font-bold text-xs">
                    {r.bloodGroup} ({r.units} unit)
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      r.verificationStatus === 'verified'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : r.verificationStatus === 'rejected'
                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {r.verificationStatus}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {r.hospital && <span>🏥 {r.hospital}</span>}
                  {r.campTitle && <span> ⛺ Camp: {r.campTitle}</span>}
                  {r.notes && <p className="italic text-[11px] mt-0.5">"{r.notes}"</p>}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {r.verificationStatus === 'verified' && (
                  <button
                    onClick={() => handleDownloadCert(r._id, r.certificateId)}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 hover:bg-rose-100 text-xs font-bold transition flex items-center gap-1"
                  >
                    <span>📜</span>
                    <span>Certificate</span>
                  </button>
                )}

                {r.verificationStatus === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        setEditingRecord(r);
                        setFormData({
                          date: new Date(r.date).toISOString().split('T')[0],
                          bloodGroup: r.bloodGroup,
                          hospital: r.hospital || '',
                          campTitle: r.campTitle || '',
                          units: r.units || 1,
                          notes: r.notes || ''
                        });
                        setShowModal(true);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(r._id)}
                      className="px-2.5 py-1 rounded-lg text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Donation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-800">
            <h3 className="font-bold text-base text-gray-900 dark:text-white mb-4">
              {editingRecord ? 'Edit Donation Record' : 'Log Blood Donation'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-600 dark:text-gray-400 font-semibold mb-1">
                  Donation Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 font-semibold mb-1">
                    Blood Group
                  </label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 font-semibold mb-1">
                    Units (Bags)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.units}
                    onChange={(e) => setFormData({ ...formData, units: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 dark:text-gray-400 font-semibold mb-1">
                  Hospital / Blood Bank (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Government General Hospital"
                  value={formData.hospital}
                  onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-gray-600 dark:text-gray-400 font-semibold mb-1">
                  Camp Title (Optional, unlocks Camp Supporter)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rotary Club Blood Camp"
                  value={formData.campTitle}
                  onChange={(e) => setFormData({ ...formData, campTitle: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-gray-600 dark:text-gray-400 font-semibold mb-1">
                  Notes / Reference (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Any details or receipt reference"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
