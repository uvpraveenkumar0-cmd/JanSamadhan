// Government District Map page
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Map, Users, CheckCircle2, Rocket, FileText } from 'lucide-react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card, SectionHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { governmentService } from '../../services/governmentService';
import { containerVariants, cardVariants } from '../../config/motion';
import { formatNumber } from '../../lib/utils';
import { cn } from '../../lib/utils';

export default function DistrictMap() {
  const [districts, setDistricts] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    governmentService.getDistrictStats().then(d => { setDistricts(d); setLoading(false); });
  }, []);

  return (
    <PageTransition>
      <SectionHeader title="District Map" subtitle="Jharkhand — Problems and Solutions by District" />
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 mb-6">
        📍 Interactive GIS map placeholder — structured for real GIS/MapLibre integration. Click a district card to see details.
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card padding="md">
            <h3 className="text-sm font-semibold text-surface-900 mb-4">Districts of Jharkhand</h3>
            {loading ? (
              <div className="skeleton h-64 rounded-lg" />
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {districts.map(d => (
                  <button key={d.id} onClick={() => setSelected(d)}
                    className={cn('p-3 rounded-xl border text-left transition-all hover:shadow-card-md',
                      selected?.id === d.id ? 'bg-primary-600 text-white border-primary-600' : 'bg-white border-surface-200 hover:border-primary-300')}
                  >
                    <p className={cn('text-xs font-semibold truncate', selected?.id === d.id ? 'text-white' : 'text-surface-900')}>{d.name}</p>
                    <p className={cn('text-2xs mt-0.5', selected?.id === d.id ? 'text-primary-200' : 'text-surface-400')}>{d.stats?.problemsSubmitted ?? 0} problems</p>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
        <div>
          {selected ? (
            <Card padding="md">
              <h3 className="text-base font-semibold text-surface-900 mb-4">{selected.name}</h3>
              <p className="text-xs text-surface-400 mb-4">{selected.division} Division · Pop: {formatNumber(selected.population)}</p>
              <div className="space-y-3">
                {[
                  { label: 'Problems Submitted', value: selected.stats?.problemsSubmitted, icon: <FileText size={14} className="text-primary-500" /> },
                  { label: 'Verified', value: selected.stats?.problemsVerified, icon: <CheckCircle2 size={14} className="text-success-500" /> },
                  { label: 'Active Projects', value: selected.stats?.activeProjects, icon: <Map size={14} className="text-civic-500" /> },
                  { label: 'Deployed', value: selected.stats?.deployedSolutions, icon: <Rocket size={14} className="text-success-600" /> },
                  { label: 'Citizens Impacted', value: formatNumber(selected.stats?.citizensImpacted ?? 0), icon: <Users size={14} className="text-warning-500" /> },
                ].map(m => (
                  <div key={m.label} className="flex items-center justify-between p-2.5 bg-surface-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {m.icon}
                      <span className="text-xs text-surface-600">{m.label}</span>
                    </div>
                    <span className="text-sm font-bold text-surface-900">{m.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card padding="md" className="flex flex-col items-center justify-center text-center py-12">
              <Map size={32} className="text-surface-300 mb-3" />
              <p className="text-sm font-medium text-surface-600">Select a district</p>
              <p className="text-xs text-surface-400 mt-1">Click any district to view its stats</p>
            </Card>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
