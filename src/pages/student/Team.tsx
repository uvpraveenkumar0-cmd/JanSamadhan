import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Award,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  FolderGit2,
  Briefcase,
  Code2,
  Mail,
} from 'lucide-react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card, StatCard, SectionHeader, SkeletonCard } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { containerVariants, cardVariants } from '../../config/motion';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import type { StudentTeam, ProjectAssignment, Problem, TeamMemberInfo } from '../../types';

export default function StudentTeamView() {
  const { user } = useApp();
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<StudentTeam | null>(null);
  const [activeProjects, setActiveProjects] = useState<{ assignment: ProjectAssignment; problem: Problem | null }[]>([]);

  useEffect(() => {
    loadTeamData();
  }, [user]);

  const loadTeamData = () => {
    setLoading(true);
    try {
      const teams = db.getStudentTeams('univ1');
      // Default to team-1 (Team Innovators-07) or first team
      const myTeam = teams.find((t) => t.team_id === 'team-1') || teams[0] || null;
      setTeam(myTeam);

      if (myTeam) {
        const assignments = db.getProjectAssignments().filter(
          (a) => a.team_id === myTeam.team_id && a.team_status === 'Accepted'
        );
        const mapped = assignments.map((a) => ({
          assignment: a,
          problem: db.getProblemById(a.problem_id),
        }));
        setActiveProjects(mapped);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <SectionHeader title="My Innovation Team" subtitle="Loading team roster and active R&D workload..." />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
      </PageTransition>
    );
  }

  if (!team) {
    return (
      <PageTransition>
        <Card padding="lg" className="text-center py-12">
          <Users size={48} className="mx-auto text-surface-400 mb-3" />
          <h3 className="text-lg font-bold text-surface-900">No Team Registered</h3>
          <p className="text-sm text-surface-500 max-w-md mx-auto mt-1">
            You are not currently enrolled in a verified student innovation squad. Contact your faculty advisor or university innovation cell.
          </p>
        </Card>
      </PageTransition>
    );
  }

  const members: TeamMemberInfo[] = team.team_members || team.members || [];
  const verificationStatus = team.team_verification_status || team.verification_status || 'Verified';
  const leaderName = team.team_leader_name || team.leader_name || 'Arjun Singh';
  const isAvailable = team.availability_status === 'Available';
  const skillsList = team.skills || team.technical_skills || [];

  return (
    <PageTransition>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-surface-900">{team.team_name}</h1>
            <Badge variant="success" size="md" dot>
              {verificationStatus} Squad
            </Badge>
          </div>
          <p className="text-sm text-surface-600 mt-1">
            {team.department} · {team.branch || 'Engineering'} · {team.university_name || 'BIT Sindri'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="primary" size="md">
            Lead: {leaderName}
          </Badge>
          <Badge variant={isAvailable ? 'success' : 'warning'} size="md">
            {isAvailable ? 'Ready for Assignments' : 'At Full Capacity'}
          </Badge>
        </div>
      </div>

      {/* KPI Stats */}
      <motion.div
        variants={containerVariants()}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
      >
        <motion.div variants={cardVariants}>
          <StatCard
            label="Squad Members"
            value={`${members.length} Members`}
            color="blue"
            icon={<Users size={20} />}
          />
        </motion.div>
        <motion.div variants={cardVariants}>
          <StatCard
            label="Track Record"
            value={`${team.projects_completed || 2} Projects`}
            color="purple"
            icon={<Award size={20} />}
          />
        </motion.div>
        <motion.div variants={cardVariants}>
          <StatCard
            label="Active R&D Workload"
            value={`${team.current_active_projects} / ${team.maximum_active_projects}`}
            color={team.current_active_projects < team.maximum_active_projects ? 'green' : 'yellow'}
            icon={<FolderGit2 size={20} />}
          />
        </motion.div>
        <motion.div variants={cardVariants}>
          <StatCard
            label="Institutional Rating"
            value="4.9 / 5.0"
            color="teal"
            icon={<Sparkles size={20} />}
          />
        </motion.div>
      </motion.div>

      {/* Main Grid: Squad Members & Skills */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Squad Members Roster (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <SectionHeader
            title="Squad Roster & Profiles"
            subtitle="Verified student researchers, developers, and field coordinators"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map((member, idx) => (
              <Card key={idx} padding="md" className="border-l-4 border-l-primary-500 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-indigo-700 flex items-center justify-center text-white font-bold text-sm">
                      {member.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-surface-900 flex items-center gap-1.5">
                        {member.name}
                        {member.role?.toLowerCase().includes('lead') && (
                          <Badge variant="primary" size="sm">
                            Lead
                          </Badge>
                        )}
                      </h4>
                      <p className="text-xs text-surface-500">{member.role}</p>
                    </div>
                  </div>
                  <Badge variant="gray" size="sm">
                    Year {member.year}
                  </Badge>
                </div>

                <div className="mt-4 pt-3 border-t border-surface-100 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-surface-600">
                    <span className="text-surface-400">Department:</span>
                    <span className="font-medium text-surface-800">{member.department}</span>
                  </div>
                  <div className="flex items-center justify-between text-surface-600">
                    <span className="text-surface-400">Student ID:</span>
                    <span className="font-mono text-surface-700">{member.student_id}</span>
                  </div>
                  <div className="flex items-center justify-between text-surface-600">
                    <span className="text-surface-400">Email:</span>
                    <a
                      href={`mailto:${member.email}`}
                      className="text-primary-600 hover:underline flex items-center gap-1"
                    >
                      <Mail size={12} />
                      {member.email}
                    </a>
                  </div>
                </div>

                <div className="mt-3 pt-2">
                  <span className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider block mb-1.5">
                    Competencies
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(member.skills || []).map((skill: string, sIdx: number) => (
                      <span
                        key={sIdx}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-surface-100 text-surface-700 border border-surface-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Column: Skills, Capacity & Governance */}
        <div className="space-y-6">
          {/* Institutional Endorsement */}
          <Card padding="md" className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
            <div className="flex items-start gap-3">
              <ShieldCheck size={24} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-emerald-950">University Endorsement</h4>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                  Officially verified by the Academic Research & Innovation Cell of{' '}
                  <strong>{team.university_name || 'BIT Sindri'}</strong>. Certified eligible for government & municipal innovation projects.
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                  <CheckCircle2 size={14} />
                  KYC & Academic Records Verified
                </div>
              </div>
            </div>
          </Card>

          {/* Collective Domain Specializations */}
          <Card padding="md">
            <h3 className="text-sm font-bold text-surface-900 mb-3 flex items-center gap-2">
              <Code2 size={16} className="text-primary-600" />
              Collective Squad Skills
            </h3>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {skillsList.map((skill, idx) => (
                <Badge key={idx} variant="primary" size="md">
                  {skill}
                </Badge>
              ))}
            </div>
            <div className="border-t border-surface-100 pt-3">
              <h4 className="text-xs font-semibold text-surface-600 uppercase tracking-wider mb-2">
                Primary Focus Domains
              </h4>
              <div className="flex flex-wrap gap-1">
                {(team.preferred_problem_categories || team.domain_expertise || []).map((domain: string, idx: number) => (
                  <Badge key={idx} variant="ai" size="sm">
                    {domain}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>

          {/* Active Allocated Problem */}
          <Card padding="md">
            <h3 className="text-sm font-bold text-surface-900 mb-3 flex items-center gap-2">
              <Briefcase size={16} className="text-primary-600" />
              Current Allocated Projects
            </h3>
            {activeProjects.length === 0 ? (
              <p className="text-xs text-surface-500 py-3 text-center">
                No active projects in R&D phase currently.
              </p>
            ) : (
              <div className="space-y-3">
                {activeProjects.map(({ assignment, problem }, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-surface-50 border border-surface-200 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-surface-900">{assignment.problem_id}</span>
                      <Badge variant="success" size="sm">
                        {assignment.project_status}
                      </Badge>
                    </div>
                    <p className="font-medium text-surface-800 line-clamp-2">
                      {problem?.title || 'Municipal Redressal Project'}
                    </p>
                    <div className="text-surface-500 text-[11px] pt-1">
                      Mentor: <span className="font-semibold text-surface-700">{assignment.faculty_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
