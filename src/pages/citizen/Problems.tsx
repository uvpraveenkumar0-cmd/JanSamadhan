import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, ArrowRight, Search, Filter } from 'lucide-react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card, SectionHeader, SkeletonCard, EmptyState } from '../../components/ui/Card';
import { StatusBadge, Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { containerVariants, cardVariants, MOTION } from '../../config/motion';
import { problemService } from '../../services/problemService';
import { useApp } from '../../context/AppContext';
import { formatDate, STATUS_LABELS, DOMAIN_LABELS } from '../../lib/utils';
import type { Problem } from '../../types';

export default function CitizenProblems() {
  const { user } = useApp();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    problemService.getAll().then(all => {
      const myProbs = all.filter(
        p => p.citizenId === user.id || p.citizenId === user.profileId || p.citizen_id === user.id || p.citizenName === user.name
      );
      setProblems(myProbs.length > 0 ? myProbs : all);
      setLoading(false);
    });
  }, [user]);

  const filtered = problems.filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageTransition>
      <SectionHeader
        title="My Problems"
        subtitle={`${problems.length} problem${problems.length !== 1 ? 's' : ''} submitted`}
        action={
          <Link to="/citizen/problems/new">
            <Button variant="primary">Submit New Problem</Button>
          </Link>
        }
      />

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
        <input
          className="input pl-9"
          placeholder="Search your problems by ID, title..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileText size={40} />}
          title={search ? 'No results found' : 'No problems submitted yet'}
          description={search ? 'Try a different search term' : 'Submit your first community problem'}
          action={!search && <Link to="/citizen/problems/new"><Button variant="primary">Submit Problem</Button></Link>}
        />
      ) : (
        <motion.div variants={containerVariants()} initial="initial" animate="animate" className="space-y-3">
          {filtered.map(p => (
            <motion.div key={p.id} variants={cardVariants} whileHover={{ scale: 1.005 }}>
              <Card padding="md" className="hover:shadow-card-md transition-all">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-surface-900">{p.title}</p>
                      <StatusBadge status={p.status} label={STATUS_LABELS[p.status] ?? p.status} />
                      {p.verification_status === 'Verified' && (
                        <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-medium border border-emerald-200">
                          ✓ Verified
                        </span>
                      )}
                      {p.assigned_university_name && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium border border-blue-200">
                          🏛 {p.assigned_university_name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-surface-400 mb-2 flex-wrap">
                      <span className="font-mono font-medium text-primary-700">{p.id}</span>
                      <span>·</span>
                      <Badge variant="gray" size="sm">{DOMAIN_LABELS[p.domain] ?? p.domain}</Badge>
                      <span>·</span>
                      <span>{p.district}</span>
                      <span>·</span>
                      <span>Submitted {formatDate(p.submittedAt)}</span>
                    </div>
                    <p className="text-xs text-surface-500 line-clamp-2">{p.description}</p>
                  </div>
                  <Link to={`/citizen/track?problemId=${p.id}`}>
                    <Button size="sm" variant="secondary" icon={<ArrowRight size={14} />}>
                      Track
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </PageTransition>
  );
}
