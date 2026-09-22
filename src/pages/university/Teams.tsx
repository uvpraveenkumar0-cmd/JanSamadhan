import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Briefcase,
  Code2,
  Layers,
  Award,
  ShieldCheck,
  Eye,
  GraduationCap,
} from 'lucide-react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card, SectionHeader, StatCard, SkeletonCard } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import type { StudentTeam } from '../../types';

export default function Teams() {
  const { user } = useApp();
  const [teamList, setTeamList] = useState<StudentTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedTeam, setSelectedTeam] = useState<StudentTeam | null>(null);

  const univId = user?.institutionId || 'univ1';
  const univName = user?.organizationName || 'BIT Sindri';

  useEffect(() => {
    loadTeams();
  }, [univId]);

  const loadTeams = () => {
    setLoading(true);
    try {
      const list = db.getStudentTeams(univId);
      setTeamList(list);
    } finally {
      setLoading(false);
    }
  };

  const departments = ['All', ...Array.from(new Set(teamList.map((t) => t.department)))];

  const filteredTeams = teamList.filter((t) => {
    const matchesSearch =
      t.team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.team_leader_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDept = selectedDept === 'All' || t.department === selectedDept;
    const matchesStatus = selectedStatus === 'All' || t.availability_status === selectedStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const availableCount = teamList.filter((t) => t.availability_status === 'Available').length;
  const activeCount = teamList.filter((t) => t.current_active_projects > 0).length;
  const totalCompleted = teamList.reduce((acc, t) => acc + t.projects_completed, 0);

  return (
    <PageTransition>
      <SectionHeader
        title="Student Innovation Teams Roster"
        subtitle={`${univName} — Interdisciplinary project squads, student capabilities, and prototype history`}
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Student Teams"
          value={teamList.length}
          icon={<Users size={18} />}
          color="blue"
        />
        <StatCard
          label="Available for Deployment"
          value={availableCount}
          icon={<CheckCircle2 size={18} />}
          color="green"
        />
        <StatCard
          label="Active in R&D"
          value={activeCount}
          icon={<Briefcase size={18} />}
          color="teal"
        />
        <StatCard
          label="Completed Innovations"
          value={totalCompleted}
          icon={<Award size={18} />}
          color="yellow"
        />
      </div>

      {/* Filter & Search Toolbar */}
      <Card padding="md" className="mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Search team name, student leader, skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-surface-500">
              <Filter size={13} />
              <span>Dept:</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-surface-200 text-xs bg-white text-surface-800"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-surface-500">
              <span>Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-surface-200 text-xs bg-white text-surface-800"
              >
                <option value="All">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Busy">Busy</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Teams Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
      ) : filteredTeams.length === 0 ? (
        <Card padding="lg" className="text-center py-12 text-surface-400">
          <Users size={36} className="mx-auto mb-2 text-surface-300" />
          <p className="text-sm font-medium text-surface-600">No student teams match your filter criteria.</p>
          <p className="text-xs mt-1">Try resetting the search filters above.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTeams.map((t) => (
            <Card
              key={t.team_id}
              padding="md"
              className="hover:border-primary-300 hover:shadow-card-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-sm font-bold text-surface-900">{t.team_name}</h4>
                      <Badge variant="success" size="sm">
                        <ShieldCheck size={10} className="inline mr-0.5" /> Verified Squad
                      </Badge>
                    </div>
                    <p className="text-xs text-surface-500 mt-0.5">
                      {t.department} · <span className="font-medium text-surface-700">{t.year}</span>
                    </p>
                    <p className="text-2xs font-mono text-primary-700 mt-0.5">
                      Leader: <strong>{t.team_leader_name}</strong>
                    </p>
                  </div>

                  <span
                    className={`text-2xs font-bold px-2 py-0.5 rounded-full border ${
                      t.availability_status === 'Available'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    ● {t.availability_status}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap my-3">
                  {t.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="text-2xs font-medium bg-surface-50 text-surface-700 px-2 py-0.5 rounded border border-surface-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-3 text-2xs text-surface-500 bg-surface-50/70 p-2 rounded-lg mb-3">
                  <span>
                    Team Size: <strong>{t.team_members.length} Students</strong>
                  </span>
                  <span>·</span>
                  <span>
                    Completed: <strong>{t.projects_completed} Projects</strong>
                  </span>
                  <span>·</span>
                  <span>
                    Active: <strong>{t.current_active_projects} / {t.maximum_active_projects}</strong>
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-surface-100 flex items-center justify-between text-2xs">
                <span className="text-surface-500">
                  Preferred Domain:{' '}
                  <strong className="text-surface-800">{t.preferred_problem_categories[0] || 'Civic Tech'}</strong>
                </span>

                <Button size="sm" variant="outline" icon={<Eye size={12} />} onClick={() => setSelectedTeam(t)}>
                  View Squad
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Team Detail Modal */}
      <Modal
        open={!!selectedTeam}
        onClose={() => setSelectedTeam(null)}
        title="Student Innovation Squad Dossier"
      >
        {selectedTeam && (
          <div className="space-y-4 text-xs">
            <div className="pb-3 border-b border-surface-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-surface-900">{selectedTeam.team_name}</h3>
                  <p className="text-xs text-surface-500">
                    {selectedTeam.department} · {selectedTeam.year}
                  </p>
                </div>
                <Badge variant="success">Verified Squad</Badge>
              </div>
            </div>

            <div>
              <span className="font-bold text-surface-800 block mb-2">Team Members ({selectedTeam.team_members.length}):</span>
              <div className="space-y-2">
                {selectedTeam.team_members.map((m, i) => (
                  <div key={i} className="p-2.5 bg-surface-50 rounded-xl border border-surface-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-surface-900">{m.name}</p>
                      <p className="text-2xs text-surface-500">{m.role} · {m.department} (Yr {m.year})</p>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap justify-end">
                      {m.skills.slice(0, 2).map((s, si) => (
                        <span key={si} className="text-2xs bg-white px-1.5 py-0.5 rounded border border-surface-200 font-mono text-surface-700">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="font-bold text-surface-800 block mb-1">Domain Expertise:</span>
              <p className="text-surface-600 bg-surface-50 p-2.5 rounded-lg border border-surface-100">
                {selectedTeam.domain_expertise.join(' · ')}
              </p>
            </div>

            <div className="flex justify-end pt-3 border-t border-surface-100">
              <Button variant="outline" size="sm" onClick={() => setSelectedTeam(null)}>
                Close Dossier
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}
