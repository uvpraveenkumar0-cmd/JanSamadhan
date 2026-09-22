import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Rocket, CheckCircle2, Settings, Activity, Map } from 'lucide-react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card, SectionHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar, AnimatedCounter } from '../../components/ui/Progress';
import { containerVariants, cardVariants } from '../../config/motion';
import { cn } from '../../lib/utils';

type PilotStage = 'planning' | 'installation' | 'testing' | 'live';

const STAGES: { key: PilotStage; label: string; icon: React.ReactNode; desc: string }[] = [
  { key: 'planning',     label: 'Planning',     icon: <Settings size={18} />,     desc: 'Site survey, BoM finalized, team assembled' },
  { key: 'installation', label: 'Installation', icon: <Activity size={18} />,     desc: 'Sensor nodes installed at 3 hand-pump locations' },
  { key: 'testing',      label: 'Testing',      icon: <CheckCircle2 size={18} />, desc: 'Live data validation, threshold calibration' },
  { key: 'live',         label: 'Live',         icon: <Rocket size={18} />,       desc: 'System operational, real-time monitoring active' },
];

export default function PilotDeployment() {
  const [currentStage, setCurrentStage] = useState<PilotStage>('testing');

  const stageIdx = STAGES.findIndex(s => s.key === currentStage);

  const METRICS = [
    { name: 'pH Level', value: 7.8, target: 7.5, unit: '', status: 'normal' },
    { name: 'TDS',      value: 450, target: 500, unit: 'ppm', status: 'normal' },
    { name: 'Turbidity',value: 1.2, target: 2.0, unit: 'NTU', status: 'normal' },
    { name: 'Fluoride', value: 1.8, target: 1.5, unit: 'mg/L', status: 'warning' },
  ];

  return (
    <PageTransition>
      <SectionHeader title="Pilot Deployment" subtitle="AquaGuard — Hesag Panchayat, Kanke, Ranchi" />

      {/* Stage Tracker */}
      <Card padding="md" className="mb-6">
        <h3 className="text-sm font-semibold text-surface-900 mb-5">Deployment Stages</h3>
        <div className="flex items-center gap-0">
          {STAGES.map((s, i) => {
            const done   = i < stageIdx;
            const active = i === stageIdx;
            return (
              <div key={s.key} className="flex items-center flex-1">
                <button
                  onClick={() => setCurrentStage(s.key)}
                  className={cn(
                    'flex flex-col items-center gap-2 group w-full',
                  )}
                >
                  <motion.div
                    animate={{ backgroundColor: done ? '#22c55e' : active ? '#2563eb' : '#f1f5f9', color: done || active ? '#fff' : '#94a3b8' }}
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                  >
                    {s.icon}
                  </motion.div>
                  <p className={cn('text-xs font-medium hidden sm:block', done || active ? 'text-surface-900' : 'text-surface-400')}>{s.label}</p>
                </button>
                {i < STAGES.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2">
                    <motion.div className={cn('h-full', done ? 'bg-success-400' : 'bg-surface-200')} animate={{ scaleX: done ? 1 : 0, originX: 0 }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-5 p-3 bg-surface-50 rounded-lg">
          <p className="text-sm font-medium text-surface-800">{STAGES[stageIdx]?.label}</p>
          <p className="text-xs text-surface-500 mt-0.5">{STAGES[stageIdx]?.desc}</p>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Metrics */}
        <Card padding="md">
          <h3 className="text-sm font-semibold text-surface-900 mb-4">Live Sensor Readings</h3>
          <div className="space-y-3">
            {METRICS.map(m => (
              <div key={m.name} className="flex items-center justify-between p-3 bg-surface-50 rounded-lg">
                <div>
                  <p className="text-xs font-medium text-surface-700">{m.name}</p>
                  <p className="text-xs text-surface-400">Target: {m.target} {m.unit}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-surface-900">{m.value} <span className="text-xs font-normal text-surface-400">{m.unit}</span></p>
                  <Badge variant={m.status === 'warning' ? 'warning' : 'success'} size="sm">{m.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Impact */}
        <Card padding="md">
          <h3 className="text-sm font-semibold text-surface-900 mb-4">Pilot Impact</h3>
          <div className="space-y-4">
            <div className="p-4 bg-success-50 rounded-xl text-center">
              <p className="text-3xl font-extrabold text-success-700"><AnimatedCounter value={1247} /></p>
              <p className="text-xs text-success-600">Beneficiaries</p>
            </div>
            <ProgressBar value={78} size="md" color="success" label="Success Score" showLabel />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-surface-50 rounded-lg text-center">
                <p className="font-bold text-surface-900">3</p>
                <p className="text-surface-400">Sensors Active</p>
              </div>
              <div className="p-2.5 bg-surface-50 rounded-lg text-center">
                <p className="font-bold text-surface-900">99.2%</p>
                <p className="text-surface-400">Uptime</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
