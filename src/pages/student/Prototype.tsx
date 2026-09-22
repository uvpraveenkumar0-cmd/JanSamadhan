import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, Code2, Cpu, Globe, Server } from 'lucide-react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card, SectionHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar, ProgressRing } from '../../components/ui/Progress';
import { projectService } from '../../services/projectService';
import { containerVariants, cardVariants } from '../../config/motion';
import type { Prototype } from '../../types';

export default function StudentPrototype() {
  const [proto, setProto] = useState<Prototype | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectService.getPrototype('proj-001').then(p => { setProto(p); setLoading(false); });
  }, []);

  if (loading) return <div className="space-y-4">{[1,2].map(i=><div key={i} className="skeleton h-32 rounded-xl"/>)}</div>;
  if (!proto) return null;

  const TECH_ICONS: Record<string, React.ReactNode> = {
    'React': <Globe size={14} className="text-cyan-600" />,
    'Node.js': <Server size={14} className="text-green-600" />,
    'AWS IoT Core': <Cpu size={14} className="text-orange-600" />,
    'Arduino Mega 2560': <Code2 size={14} className="text-primary-600" />,
  };

  return (
    <PageTransition>
      <SectionHeader
        title={proto.title}
        subtitle={`Version ${proto.version} · ${proto.status.charAt(0).toUpperCase() + proto.status.slice(1)}`}
        action={
          <ProgressRing value={proto.readinessScore} size={60} color="#2563eb">
            <span className="text-xs font-bold text-surface-900">{proto.readinessScore}%</span>
          </ProgressRing>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Description */}
          <Card padding="md">
            <h3 className="text-sm font-semibold text-surface-900 mb-2">Description</h3>
            <p className="text-sm text-surface-600 leading-relaxed">{proto.description}</p>
          </Card>

          {/* Readiness Breakdown */}
          <Card padding="md">
            <h3 className="text-sm font-semibold text-surface-900 mb-4">Readiness Score Breakdown</h3>
            <div className="space-y-3">
              {[
                { label: 'Hardware Assembly',     value: 100, color: 'success' as const },
                { label: 'Firmware / Embedded',   value: 90,  color: 'success' as const },
                { label: 'Cloud Backend',         value: 80,  color: 'primary' as const },
                { label: 'Dashboard UI',          value: 65,  color: 'primary' as const },
                { label: 'Alert System',          value: 40,  color: 'warning' as const },
                { label: 'Field Calibration',     value: 50,  color: 'warning' as const },
              ].map(m => (
                <ProgressBar key={m.label} value={m.value} size="md" color={m.color} label={m.label} showLabel />
              ))}
            </div>
          </Card>

          {/* Tech Stack */}
          <Card padding="md">
            <h3 className="text-sm font-semibold text-surface-900 mb-3">Technology Stack</h3>
            <div className="flex flex-wrap gap-2">
              {proto.techStack.map(t => (
                <div key={t} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-50 border border-surface-200 rounded-lg">
                  {TECH_ICONS[t] ?? <Code2 size={14} className="text-surface-400" />}
                  <span className="text-xs font-medium text-surface-700">{t}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          <Card padding="md">
            <h4 className="text-sm font-semibold text-surface-900 mb-4">Overall Readiness</h4>
            <div className="flex justify-center mb-4">
              <ProgressRing value={proto.readinessScore} size={100} color="#2563eb" strokeWidth={10}>
                <div className="text-center">
                  <p className="text-xl font-extrabold text-surface-900">{proto.readinessScore}%</p>
                  <p className="text-2xs text-surface-400">Ready</p>
                </div>
              </ProgressRing>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-surface-500">Status</span><Badge variant="warning">Development</Badge></div>
              <div className="flex justify-between"><span className="text-surface-500">Version</span><span className="font-medium">{proto.version}</span></div>
              <div className="flex justify-between"><span className="text-surface-500">Last Updated</span><span className="font-medium">{new Date(proto.updatedAt).toLocaleDateString('en-IN')}</span></div>
            </div>
          </Card>

          <Card padding="md">
            <h4 className="text-sm font-semibold text-surface-900 mb-3">Industry Funding</h4>
            <p className="text-xs text-surface-500 mb-2">AquaTech Solutions — ₹3,50,000 approved</p>
            <ProgressBar value={36} size="md" color="success" label="₹1,27,500 utilized" showLabel />
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
