import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Microscope, MapPin, Users, Calendar, FileText } from 'lucide-react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card, SectionHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { containerVariants, cardVariants } from '../../config/motion';
import { projectService } from '../../services/projectService';
import { formatDate } from '../../lib/utils';
import type { ResearchEntry } from '../../types';
import { cn } from '../../lib/utils';

const TYPE_LABELS: Record<string, string> = {
  site_visit: 'Site Visit', survey: 'Survey', interview: 'Interview',
  data_collection: 'Data Collection', analysis: 'Analysis',
};

export default function StudentFieldResearch() {
  const [entries, setEntries] = useState<ResearchEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectService.getResearch('proj-001').then(r => { setEntries(r); setLoading(false); });
  }, []);

  return (
    <PageTransition>
      <SectionHeader title="Field Research" subtitle="Research conducted for Smart Water Quality Monitoring" />

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-surface-200 hidden sm:block" />

        {loading ? (
          <div className="space-y-4">{[1,2,3,4].map(i=><div key={i} className="skeleton h-36 rounded-xl"/>)}</div>
        ) : (
          <motion.div variants={containerVariants()} initial="initial" animate="animate" className="space-y-4">
            {entries.map((entry, i) => (
              <motion.div key={entry.id} variants={cardVariants} className="sm:flex sm:gap-6">
                {/* Icon */}
                <div className="w-10 h-10 rounded-full bg-civic-100 border-2 border-civic-300 flex items-center justify-center shrink-0 relative z-10 mb-3 sm:mb-0">
                  <Microscope size={16} className="text-civic-600" />
                </div>

                {/* Content */}
                <Card padding="md" className="flex-1">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-sm font-semibold text-surface-900">{entry.title}</h3>
                    <Badge variant="primary" size="sm">{TYPE_LABELS[entry.type] ?? entry.type}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-surface-400 mb-3">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(entry.date)}</span>
                    {entry.location && <span className="flex items-center gap-1"><MapPin size={12} /> {entry.location}</span>}
                    {entry.participants && <span className="flex items-center gap-1"><Users size={12} /> {entry.participants} participants</span>}
                  </div>
                  <div className="p-3 bg-surface-50 rounded-lg">
                    <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-1.5">Key Findings</p>
                    <p className="text-sm text-surface-700 leading-relaxed">{entry.findings}</p>
                  </div>
                  <p className="text-xs text-surface-400 mt-2">Conducted by: {entry.conductedBy}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
