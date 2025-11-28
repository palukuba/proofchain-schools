import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, FileCheck, Activity, TrendingUp, Award, Clock, HardDrive, DollarSign } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { dashboardService } from '../services/supabase/dashboardService';
import { authService } from '../services/supabase/authService';
import { useAuth } from '../contexts/AuthContext';
import { Language } from '../types';
import { useTranslation } from '../services/i18n';

interface DashboardProps {
  lang: Language;
}

const Dashboard: React.FC<DashboardProps> = ({ lang }) => {
  const t = useTranslation(lang);
  const { schoolProfile } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    issuedDiplomas: 0,
    pendingVerifications: 0,
    storageUsed: '0 GB'
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{ name: string; docs: number }[]>([]);

  useEffect(() => {
    if (schoolProfile) {
      loadDashboardData();
    }
  }, [schoolProfile]);

  const loadDashboardData = async () => {
    try {
      if (!schoolProfile) return;

      const dashboardStats = await dashboardService.getStats(schoolProfile.id);

      setStats({
        totalStudents: dashboardStats.total_students,
        issuedDiplomas: dashboardStats.total_diplomas,
        pendingVerifications: 0,
        storageUsed: (dashboardStats.total_ipfs / 1024).toFixed(2) + ' MB'
      });

      setRecentActivity([
        { id: 1, type: 'issue', description: 'Issued Diploma to John Doe', time: '2 mins ago' },
        { id: 2, type: 'student', description: 'New student registered', time: '1 hour ago' },
        { id: 3, type: 'system', description: 'System backup completed', time: '5 hours ago' },
      ]);

      setChartData([
        { name: 'Jan', docs: 4 },
        { name: 'Feb', docs: 3 },
        { name: 'Mar', docs: 2 },
        { name: 'Apr', docs: 7 },
        { name: 'May', docs: 5 },
        { name: 'Jun', docs: 9 },
      ]);

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-10"><span className="loading loading-spinner loading-lg"></span></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">{t('dashboard')}</h2>
          <p className="text-sm opacity-70">Welcome back, {schoolProfile?.name}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary gap-2">
            <Award size={18} /> Issue New Diploma
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-primary">
              <Users size={32} />
            </div>
            <div className="stat-title">Total Students</div>
            <div className="stat-value text-primary">{stats.totalStudents}</div>
            <div className="stat-desc">↗︎ 12% more than last month</div>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-secondary">
              <GraduationCap size={32} />
            </div>
            <div className="stat-title">Issued Diplomas</div>
            <div className="stat-value text-secondary">{stats.issuedDiplomas}</div>
            <div className="stat-desc">↗︎ 5 new this week</div>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-accent">
              <FileCheck size={32} />
            </div>
            <div className="stat-title">Pending Verifications</div>
            <div className="stat-value text-accent">{stats.pendingVerifications}</div>
            <div className="stat-desc">Requires attention</div>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-info">
              <HardDrive size={32} />
            </div>
            <div className="stat-title">Storage Used</div>
            <div className="stat-value text-info text-2xl">{stats.storageUsed}</div>
            <div className="stat-desc">of 5GB Quota</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <div className="card bg-base-100 shadow-xl lg:col-span-2">
          <div className="card-body">
            <h3 className="card-title mb-4">Issuance Activity</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--b1))', borderColor: 'hsl(var(--b3))' }}
                    itemStyle={{ color: 'hsl(var(--bc))' }}
                  />
                  <Bar dataKey="docs" fill="hsl(var(--p))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title mb-4 flex items-center gap-2">
              <Activity size={20} /> Recent Activity
            </h3>
            <ul className="steps steps-vertical w-full">
              {recentActivity.map((activity) => (
                <li key={activity.id} className="step step-primary">
                  <div className="text-left w-full ml-2 mb-4">
                    <div className="font-bold text-sm">{activity.description}</div>
                    <div className="text-xs opacity-60 flex items-center gap-1">
                      <Clock size={10} /> {activity.time}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <button className="btn btn-ghost btn-sm w-full mt-2">View All History</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;