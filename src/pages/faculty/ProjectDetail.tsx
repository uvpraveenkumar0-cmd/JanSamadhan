import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, AlertCircle, ChevronDown, Cpu, FileText, MessageSquare } from 'lucide-react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card, SectionHeader, ErrorState } from '../../components/ui/Card';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { ProgressBar, ProgressRing } from '../../components/ui/Progress';
import { containerVariants, cardVariants } from '../../config/motion';
import { projectService } from '../../services/projectService';
import { PHASE_LABELS, formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';
import type { Project, Milestone } from '../../types';

const PHASE_ICONS: Record<string, React.ReactNode> = {
  problem_understanding: '🎯',
  field_research:        '🔬',
  requirement_analysis:  '📋',
  solution_design:       '✏️',
  prototype:             '⚙️',
  testing:               '🧪',
  pilot:                 '🚀',
  deployment:            '🌍',
};

const STATUS_COLORS = {
  completed:   'bg-success-500 border-success-500 text-white',
  in_progress: 'bg-primary-600 border-primary-600 text-white',
  pending:     'bg-white border-surface-300 text-surface-400',
  overdue:     'bg-danger-500 border-danger-500 text-white',
};

export default function FacultyProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const projectId = id ?? 'proj-001';
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>('m5'); // expand active

  useEffect(() => {
    projectService.getById(projectId).then(p => { setProject(p); setLoading(false); });
  }, [projectId]);

  if (loading) return <div className="p-6 space-y-4">{[1,2,3].map(i=><div key={i} className="skeleton h-24 rounded-xl"/>)}</div>;
  if (!project) return <ErrorState title="Project not found" description="This project does not exist or you don't have access." />;

  const completedPhases = project.milestones.filter(m => m.status === 'completed').length;

  return (
    <PageTransition>
      <SectionHeader
        title={project.problem}
        subtitle={`${project.university} · ${project.faculty}`}
        action={<ProgressRing value={project.overallProgress} size={56} color="#2563eb"><span className="text-xs font-bold text-surface-900">{project.overallProgress}%</span></ProgressRing>}
      />

      {/* Phase Overview */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
        {project.milestones.map((m, i) => (
          <div key={m.id} className="flex items-center gap-2 shrink-0">
            <div className={cn('w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm', STATUS_COLORS[m.status])}>
              {m.status === 'completed' ? <Check size={14} /> : <span>{i + 1}</span>}
            </div>
            {i < project.milestones.length - 1 && (
              <div className={cn('h-0.5 w-8', m.status === 'completed' ? 'bg-success-400' : 'bg-surface-200')} />
            )}
          </div>
        ))}
        <span className="ml-2 text-xs text-surface-500 shrink-0">{completedPhases}/{project.milestones.length} phases complete</span>
      </div>

      {/* Milestones */}
      <div className="space-y-3">
        {project.milestones.map((m, i) => {
          const isExpanded = expanded === m.id;
          return (
            <Card key={m.id} padding="none" className={cn(m.status === 'in_progress' && 'ring-2 ring-primary-300 ring-offset-1')}>
              <button
                className="w-full flex items-start gap-4 p-4 text-left hover:bg-surface-50/50 rounded-xl transition-colors"
                onClick={() => setExpanded(isExpanded ? null : m.id)}
              >
                {/* Phase Icon */}
                <div className={cn('w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 text-sm', STATUS_COLORS[m.status])}>
                  {m.status === 'completed' ? <Check size={14} /> : m.status === 'in_progress' ? <Clock size={14} /> : <span>{i + 1}</span>}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm">{PHASE_ICONS[m.phase]}</span>
                    <h3 className="text-sm font-semibold text-surface-900">{m.title}</h3>
                    <StatusBadge status={m.status} label={m.status.replace('_', ' ')} />
                  </div>
                  <p className="text-xs text-surface-400">Due: {formatDate(m.dueDate)}{m.completedAt && ` · Completed: ${formatDate(m.completedAt)}`}</p>
                  {m.status !== 'pending' && (
                    <div className="mt-2">
                      <ProgressBar value={m.progress} size="sm" color={m.status === 'completed' ? 'success' : 'primary'} />
                    </div>
                  )}
                </div>

                <ChevronDown size={16} className={cn('text-surface-400 transition-transform shrink-0 mt-1', isExpanded && 'rotate-180')} />
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 border-t border-surface-100 pt-3 space-y-3">
                      <p className="text-sm text-surface-600">{m.description}</p>

                      {/* Deliverables */}
                      {m.deliverables.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">Deliverables</p>
                          <div className="flex flex-wrap gap-1.5">
                            {m.deliverables.map(d => (
                              <span key={d} className={cn('text-xs px-2 py-1 rounded-lg border', m.status === 'completed' ? 'bg-success-50 text-success-700 border-success-200' : 'bg-surface-50 text-surface-600 border-surface-200')}>
                                {m.status === 'completed' && '✓ '}{d}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Documents */}
                      {m.documents.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">Documents</p>
                          <div className="flex flex-wrap gap-1.5">
                            {m.documents.map(d => (
                              <span key={d} className="text-xs px-2 py-1 rounded border bg-primary-50 text-primary-700 border-primary-200 flex items-center gap-1">
                                <FileText size={10} /> {d}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>
    </PageTransition>
  );
}
