import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Shield, Flag, CheckCircle, XCircle, Users, Building, Activity } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { CardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

export default function AdminPage() {
  const { dbUser, loading } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState('reports');

  if (loading) return <div className="p-8 text-center">Loading…</div>;
  if (dbUser?.role !== 'admin') return <Navigate to="/" replace />;

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: () => api.get('/reports').then(r => r.data),
    enabled: tab === 'reports',
  });

  const { data: hospitals, isLoading: hospitalsLoading } = useQuery({
    queryKey: ['admin', 'hospitals'],
    queryFn: () => api.get('/hospitals?status=Pending').then(r => r.data.data), // Add backend support for fetching pending
    enabled: tab === 'hospitals',
  });

  const reportAction = useMutation({
    mutationFn: ({ id, action }) => api.patch(`/reports/${id}`, { action }),
    onSuccess: () => { toast.success('Action taken.'); qc.invalidateQueries({ queryKey: ['admin', 'reports'] }); },
    onError: (err) => toast.error(err.message),
  });

  const hospitalAction = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/hospitals/${id}/status`, { status }),
    onSuccess: () => { toast.success('Hospital updated.'); qc.invalidateQueries({ queryKey: ['admin', 'hospitals'] }); },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl brand-gradient text-white shadow-md">
          <Shield size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Manage reports and verifications</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mb-6">
        <button onClick={() => setTab('reports')} className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${tab === 'reports' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <div className="flex items-center gap-2"><Flag size={16} /> User Reports</div>
        </button>
        <button onClick={() => setTab('hospitals')} className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${tab === 'hospitals' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <div className="flex items-center gap-2"><Building size={16} /> Pending Hospitals</div>
        </button>
      </div>

      {tab === 'reports' && (
        <div className="space-y-4">
          {reportsLoading ? <CardSkeleton /> : !reports?.length ? (
            <EmptyState title="No pending reports" message="The community is looking good." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {reports.map(r => (
                <div key={r._id} className="glass-card p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{r.targetType}</span>
                      <div className="font-medium text-sm mt-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-2 rounded">
                        "{r.reason}"
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-xs text-gray-500 break-all">
                    Target ID: {r.targetId}<br/>
                    Reported by: {r.reportedBy}
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={() => reportAction.mutate({ id: r._id, action: 'RemovedTarget' })} className="btn-primary py-1.5 px-3 text-sm flex-1 bg-red-600 hover:bg-red-700">
                      Delete Content
                    </button>
                    <button onClick={() => reportAction.mutate({ id: r._id, action: 'Dismissed' })} className="btn-secondary py-1.5 px-3 text-sm flex-1">
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'hospitals' && (
        <div className="space-y-4">
          {hospitalsLoading ? <CardSkeleton /> : !hospitals?.length ? (
            <EmptyState title="No pending hospitals" message="All caught up!" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {hospitals.map(h => (
                <div key={h._id} className="glass-card p-5 space-y-3">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-bold">{h.name}</h3>
                      <div className="text-sm text-gray-500">{h.type} • {h.district}</div>
                    </div>
                    {h.is24x7 && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded">24×7</span>}
                  </div>
                  <div className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    {h.address}<br/>
                    📞 {h.phone}
                  </div>
                  <div className="text-xs text-gray-500">Submitted by: {h.submittedBy}</div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => hospitalAction.mutate({ id: h._id, status: 'Approved' })} className="btn-primary py-1.5 px-3 text-sm flex-1 bg-green-600 hover:bg-green-700">
                      <CheckCircle size={16} /> Approve
                    </button>
                    <button onClick={() => hospitalAction.mutate({ id: h._id, status: 'Rejected' })} className="btn-secondary py-1.5 px-3 text-sm flex-1 text-red-600">
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
