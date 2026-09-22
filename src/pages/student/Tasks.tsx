import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Clock, ArrowRight } from 'lucide-react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card, SectionHeader, EmptyState } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { projectService } from '../../services/projectService';
import { useApp } from '../../context/AppContext';
import { containerVariants, cardVariants } from '../../config/motion';
import type { Task } from '../../types';
import { cn } from '../../lib/utils';

const COLUMNS: { status: Task['status']; label: string; color: string }[] = [
  { status: 'todo',        label: 'To Do',       color: 'border-t-surface-300' },
  { status: 'in_progress', label: 'In Progress',  color: 'border-t-primary-400' },
  { status: 'completed',   label: 'Completed',    color: 'border-t-success-400' },
];

export default function StudentTasks() {
  const { addToast } = useApp();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectService.getTasks('proj-001').then(t => { setTasks(t); setLoading(false); });
  }, []);

  const moveTask = async (taskId: string, newStatus: Task['status']) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    await projectService.updateTask(taskId, { status: newStatus });
    addToast({ type: 'success', title: 'Task updated', message: `Moved to ${newStatus.replace('_', ' ')}` });
  };

  const tasksByStatus = (status: Task['status']) => tasks.filter(t => t.status === status);

  return (
    <PageTransition>
      <SectionHeader title="My Tasks" subtitle={`AquaGuard Project · ${tasks.filter(t => t.status !== 'completed').length} open tasks`} />

      {loading ? (
        <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i=><div key={i} className="skeleton h-48 rounded-xl"/>)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map(col => (
            <div key={col.status} className="space-y-3">
              <div className={cn('flex items-center justify-between pb-2 border-b-2', col.color.replace('border-t-', 'border-b-'))}>
                <h3 className="text-sm font-semibold text-surface-700">{col.label}</h3>
                <Badge variant="gray" size="sm">{tasksByStatus(col.status).length}</Badge>
              </div>
              <motion.div layout className="space-y-3 min-h-16">
                <AnimatePresence mode="popLayout">
                  {tasksByStatus(col.status).map(task => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card padding="sm" className="cursor-pointer hover:shadow-card-md transition-all">
                        <div className="flex items-start gap-2 mb-2">
                          <button
                            onClick={() => moveTask(task.id, task.status === 'completed' ? 'todo' : task.status === 'todo' ? 'in_progress' : 'completed')}
                            className="shrink-0 mt-0.5"
                          >
                            {task.status === 'completed'
                              ? <CheckCircle2 size={16} className="text-success-500" />
                              : task.status === 'in_progress'
                              ? <Clock size={16} className="text-primary-500" />
                              : <Circle size={16} className="text-surface-300" />
                            }
                          </button>
                          <p className={cn('text-xs font-medium leading-relaxed', task.status === 'completed' && 'line-through text-surface-400')}>
                            {task.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'gray'} size="sm">{task.priority}</Badge>
                          <span className="text-2xs text-surface-400">Due {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        </div>
                        {/* Move buttons */}
                        <div className="flex gap-1 mt-2">
                          {col.status !== 'todo' && (
                            <button onClick={() => moveTask(task.id, 'todo')} className="text-2xs text-surface-400 hover:text-surface-600 px-1.5 py-0.5 hover:bg-surface-100 rounded transition-colors">← To Do</button>
                          )}
                          {col.status !== 'in_progress' && (
                            <button onClick={() => moveTask(task.id, 'in_progress')} className="text-2xs text-primary-600 hover:text-primary-700 px-1.5 py-0.5 hover:bg-primary-50 rounded transition-colors">In Progress</button>
                          )}
                          {col.status !== 'completed' && (
                            <button onClick={() => moveTask(task.id, 'completed')} className="text-2xs text-success-600 hover:text-success-700 px-1.5 py-0.5 hover:bg-success-50 rounded transition-colors">Done ✓</button>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {tasksByStatus(col.status).length === 0 && (
                  <div className="text-center py-6 text-surface-300 text-xs">No tasks here</div>
                )}
              </motion.div>
            </div>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
