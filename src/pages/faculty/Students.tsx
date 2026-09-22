import React, { useState, useEffect } from 'react';
import { PageTransition } from '../../components/ui/PageTransition';
import { SectionHeader, Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Users,
  Layers,
  GraduationCap,
  Mail,
  Award,
  Wrench,
  CheckCircle2,
  ExternalLink,
  Search,
} from 'lucide-react';
import { db } from '../../services/db';
import type { StudentTeam, ProjectAssignment } from '../../types';
import { ProblemEcosystemModal } from '../../components/common/ProblemEcosystemModal';

export default function FacultyStudents() {
  const [teams, setTeams] = useState<StudentTeam[]>([]);
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTraceProblemId, setSelectedTraceProblemId] = useState<string | null>(null);

  useEffect(() => {
    const loadedTeams = db.getStudentTeams();
    const loadedAssignments = db.getProjectAssignments();
    setTeams(loadedTeams);
    setAssignments(loadedAssignments);
  }, []);

  const filteredTeams = teams.filter(t =>
    t.team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.team_leader_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SectionHeader
            title="Student Innovation Squads"
            subtitle="Undergraduate and graduate student teams assigned to active citizen civic challenges"
          />
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search teams, student leads, or engineering branches..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-surface-200 rounded-xl text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Squad Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredTeams.map(team => {
            const teamAssignment = assignments.find(a => a.team_id === team.team_id);
            const prob = teamAssignment ? db.getProblemById(teamAssignment.problem_id) : null;
            const teamTasks = teamAssignment ? db.getTasks(teamAssignment.problem_id) : [];

            return (
              <Card key={team.team_id} padding="lg" className="flex flex-col justify-between border border-surface-200 bg-white shadow-card-sm hover:shadow-card transition-all">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {team.team_id.toUpperCase()}
                        </span>
                        <Badge variant="success">{team.availability_status}</Badge>
                      </div>
                      <h3 className="text-base font-bold text-surface-900 tracking-tight">{team.team_name}</h3>
                      <p className="text-xs text-surface-500">{team.university_name || 'BIT Sindri'} • {team.department}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-semibold text-surface-800">Lead: {team.team_leader_name}</span>
                      <p className="text-[11px] text-surface-500">{team.team_members?.length || 4} student researchers</p>
                    </div>
                  </div>

                  {/* Active Civic Problem Assignment */}
                  {teamAssignment && prob ? (
                    <div className="p-3 rounded-xl bg-surface-50 border border-surface-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider">
                          Active Citizen Mission:
                        </span>
                        <button
                          onClick={() => setSelectedTraceProblemId(teamAssignment.problem_id)}
                          className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100 transition-colors"
                        >
                          <Layers size={11} /> {teamAssignment.problem_id}
                        </button>
                      </div>
                      <p className="text-xs font-semibold text-surface-900 line-clamp-1">{prob.title}</p>
                      <div className="flex items-center justify-between text-[11px] text-surface-500 pt-1">
                        <span>Progress: <strong className="text-emerald-700">{teamAssignment.progress}%</strong></span>
                        <span>Active Tasks: <strong className="text-primary-700">{teamTasks.length}</strong></span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-surface-50 border border-surface-200 text-xs text-surface-500 italic">
                      Squad currently available for new municipal grievance assignment.
                    </div>
                  )}

                  {/* Member Grid */}
                  <div>
                    <span className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider block mb-2">
                      Squad Roster:
                    </span>
                    <div className="space-y-1.5">
                      {(team.team_members || []).map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-surface-50 border border-surface-200 text-xs">
                          <div>
                            <span className="font-semibold text-surface-900">{m.name}</span>
                            <span className="text-surface-500 text-[11px] ml-1.5">({m.role})</span>
                          </div>
                          <span className="text-[11px] font-mono text-surface-500">{m.department.split(' ')[0]} Yr {m.year}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Technical Skills */}
                  <div>
                    <span className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider block mb-1.5">
                      Skill Competencies:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {(team.technical_skills || team.skills || []).map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-surface-100 text-surface-700 border border-surface-200 font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-4 mt-4 border-t border-surface-100 flex items-center justify-between">
                  <span className="text-xs text-surface-500">
                    Faculty Mentor: Dr. Anita Sharma
                  </span>
                  {teamAssignment && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTraceProblemId(teamAssignment.problem_id)}
                      className="text-xs flex items-center gap-1"
                    >
                      <Layers size={13} /> View Trace
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Lifecycle Trace Modal */}
      <ProblemEcosystemModal
        problemId={selectedTraceProblemId}
        isOpen={!!selectedTraceProblemId}
        onClose={() => setSelectedTraceProblemId(null)}
      />
    </PageTransition>
  );
}
