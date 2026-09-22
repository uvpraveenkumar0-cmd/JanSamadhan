import React from 'react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card, SectionHeader } from '../../components/ui/Card';
import { UNIVERSITIES } from '../../data/mockData';
import { Badge } from '../../components/ui/Badge';
import { motion } from 'framer-motion';
import { containerVariants, cardVariants } from '../../config/motion';
import { Building2 } from 'lucide-react';

export default function Institutions() {
  return (
    <PageTransition>
      <SectionHeader title="Institutions" subtitle="Higher Education Institutions registered on the platform" />
      <motion.div variants={containerVariants()} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {UNIVERSITIES.map(u => (
          <motion.div key={u.id} variants={cardVariants} whileHover={{ scale: 1.02 }}>
            <Card padding="md">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-civic-50 rounded-xl flex items-center justify-center">
                  <Building2 size={20} className="text-civic-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-surface-900">{u.name}</h3>
                  <p className="text-xs text-surface-400">{u.city} · NAAC {u.naacGrade}</p>
                </div>
                <Badge variant={u.type === 'central' ? 'official' : u.type === 'deemed' ? 'ai' : 'civic'} size="sm">{u.type}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-surface-50 rounded-lg">
                  <p className="text-sm font-bold text-surface-900">{u.activeProjects}</p>
                  <p className="text-2xs text-surface-400">Active</p>
                </div>
                <div className="p-2 bg-surface-50 rounded-lg">
                  <p className="text-sm font-bold text-surface-900">{u.completedProjects}</p>
                  <p className="text-2xs text-surface-400">Done</p>
                </div>
                <div className="p-2 bg-surface-50 rounded-lg">
                  <p className="text-sm font-bold text-surface-900">{u.facultyCount}</p>
                  <p className="text-2xs text-surface-400">Faculty</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </PageTransition>
  );
}
