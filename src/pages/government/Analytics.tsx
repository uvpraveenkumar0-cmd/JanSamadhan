import React, { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Funnel, FunnelChart, LabelList } from 'recharts';
import { motion } from 'framer-motion';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card, SectionHeader, StatCard } from '../../components/ui/Card';
import { AnimatedCounter } from '../../components/ui/Progress';
import { governmentService } from '../../services/governmentService';
import { containerVariants, cardVariants, MOTION } from '../../config/motion';

const COLORS = ['#0ea5e9','#ec4899','#22c55e','#f59e0b','#8b5cf6','#f97316','#14b8a6','#64748b','#d97706','#7c3aed','#0369a1'];

const CUSTOM_TOOLTIP = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-surface-200 rounded-lg shadow-card-md p-3">
      <p className="text-xs font-semibold text-surface-900 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

export default function GovernmentAnalytics() {
  const [byDomain, setByDomain] = useState<any[]>([]);
  const [byDistrict, setByDistrict] = useState<any[]>([]);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      governmentService.getAnalyticsByDomain(),
      governmentService.getAnalyticsByDistrict(),
      governmentService.getMonthlyAnalytics(),
    ]).then(([d, dist, m]) => {
      setByDomain(d);
      setByDistrict(dist);
      setMonthly(m);
      setLoading(false);
    });
  }, []);

  const funnelData = [
    { value: 10482, name: 'Submitted',   fill: '#e2e8f0' },
    { value: 8921,  name: 'Verified',    fill: '#bfdbfe' },
    { value: 2847,  name: 'Allocated',   fill: '#93c5fd' },
    { value: 1240,  name: 'In Progress', fill: '#60a5fa' },
    { value: 412,   name: 'Piloted',     fill: '#3b82f6' },
    { value: 1946,  name: 'Deployed',    fill: '#1d4ed8' },
  ];

  return (
    <PageTransition>
      <SectionHeader
        title="Government Analytics"
        subtitle="Comprehensive platform impact data — Jharkhand Innovation Hub"
      />

      {/* Impact KPIs */}
      <motion.div variants={containerVariants(MOTION.stagger.sm)} initial="initial" animate="animate" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Submissions', value: '10,482', color: 'blue'   as const },
          { label: 'Verified',          value: '8,921',  color: 'green'  as const },
          { label: 'Deployed',          value: '1,946',  color: 'teal'   as const },
          { label: 'Citizens Impacted', value: '2.4M',   color: 'purple' as const },
        ].map((k, i) => (
          <motion.div key={i} variants={cardVariants}>
            <Card padding="md">
              <p className="text-xs font-medium text-surface-500 uppercase tracking-wide mb-1">{k.label}</p>
              <p className="text-2xl font-bold text-surface-900">{k.value}</p>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card padding="md">
          <h3 className="text-sm font-semibold text-surface-900 mb-4">Monthly Trends</h3>
          {!loading && (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CUSTOM_TOOLTIP />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="submissions" name="Submissions" stroke="#3b82f6" strokeWidth={2} dot={false} animationDuration={800} />
                <Line type="monotone" dataKey="verified"    name="Verified"    stroke="#22c55e" strokeWidth={2} dot={false} animationDuration={800} />
                <Line type="monotone" dataKey="deployed"    name="Deployed"    stroke="#0ea5e9" strokeWidth={2} dot={false} animationDuration={800} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Problems by Domain (Donut) */}
        <Card padding="md">
          <h3 className="text-sm font-semibold text-surface-900 mb-4">Challenges by Domain</h3>
          {!loading && (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={byDomain}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={90}
                  dataKey="value"
                  nameKey="name"
                  animationBegin={0}
                  animationDuration={800}
                  label={(entry: any) => `${entry?.name ?? ''} ${(((entry?.percent ?? 0)) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {byDomain.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* By District */}
        <Card padding="md">
          <h3 className="text-sm font-semibold text-surface-900 mb-4">Problems by District</h3>
          {!loading && (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byDistrict} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="district" tick={{ fontSize: 10 }} width={80} />
                <Tooltip content={<CUSTOM_TOOLTIP />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="submitted" name="Submitted" fill="#bfdbfe" animationDuration={800} />
                <Bar dataKey="verified"  name="Verified"  fill="#3b82f6" animationDuration={800} />
                <Bar dataKey="deployed"  name="Deployed"  fill="#1d4ed8" animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Solution Pipeline Funnel */}
        <Card padding="md">
          <h3 className="text-sm font-semibold text-surface-900 mb-4">Solution Pipeline</h3>
          <div className="space-y-2">
            {funnelData.map((f, i) => (
              <div key={f.name} className="flex items-center gap-3">
                <span className="text-xs text-surface-500 w-24 shrink-0">{f.name}</span>
                <div className="flex-1 h-6 rounded-md overflow-hidden bg-surface-100">
                  <motion.div
                    className="h-full rounded-md flex items-center justify-end pr-2"
                    style={{ backgroundColor: f.fill }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(f.value / 10482) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  >
                    <span className="text-xs font-bold text-surface-700">{f.value.toLocaleString()}</span>
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
