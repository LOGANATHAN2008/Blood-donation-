import { useState } from 'react';
import { Users, Droplets, Heart, Activity, AlertOctagon } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Admin Dashboard</h1>
        <div className="text-sm text-gray-500">Live Statistics Overview</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Users" value="---" icon={Users} color="bg-blue-500" />
        <StatCard title="Active Donors" value="---" icon={Droplets} color="bg-brand-500" />
        <StatCard title="Open Requests" value="---" icon={Heart} color="bg-rose-500" />
        <StatCard title="Pending Reports" value="---" icon={AlertOctagon} color="bg-orange-500" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 min-h-[300px] flex items-center justify-center">
          <p className="text-gray-400">Charts will go here...</p>
        </div>
        <div className="glass-card p-6 min-h-[300px] flex items-center justify-center">
          <p className="text-gray-400">Recent Audit Logs will go here...</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="glass-card p-4 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-black text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}
