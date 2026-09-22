import React, { useState, useEffect } from 'react';
import { PageTransition } from '../../components/ui/PageTransition';
import { SectionHeader, Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  MessageSquare,
  Layers,
  GraduationCap,
  Building2,
  Users,
  CheckCircle2,
  Calendar,
  Star,
  Quote,
} from 'lucide-react';
import { db } from '../../services/db';
import { ProblemEcosystemModal } from '../../components/common/ProblemEcosystemModal';

export default function StudentFeedback() {
  const [selectedTraceProblemId, setSelectedTraceProblemId] = useState<string | null>(null);

  const asgn = db.getProjectAssignmentByProblemId('P-1030') || db.getProjectAssignments()[0];
  const prob = asgn ? db.getProblemById(asgn.problem_id) : null;
  const proto = asgn ? db.getPrototypeByProblemId(asgn.problem_id) : null;

  const milestoneRemarks = (asgn?.milestones || [])
    .filter(m => m.faculty_remarks)
    .map(m => ({
      source: 'Faculty Mentor',
      author: asgn?.faculty_name || 'Dr. Anita Sharma',
      role: 'Principal Investigator',
      milestone: m.title,
      text: m.faculty_remarks!,
      date: m.due_date,
      type: 'academic',
    }));

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SectionHeader
            title="Ecosystem Feedback & Mentorship Reviews"
            subtitle="Guidance from Faculty Mentors, Government Authorities, and Beneficiary Citizens"
          />
          {asgn && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedTraceProblemId(asgn.problem_id)}
              className="text-xs flex items-center gap-1.5"
            >
              <Layers size={13} /> Inspect {asgn.problem_id} Lifecycle Trace
            </Button>
          )}
        </div>

        {/* Feedback Feed */}
        <div className="space-y-4">
          {/* Official Govt Feedback */}
          {proto?.governmentFeedback && (
            <Card padding="lg" className="border-l-4 border-l-primary-500 border border-surface-200 bg-white shadow-card-sm">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary-50 text-primary-600">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-surface-900">Government & Agricultural Directorate</h4>
                    <span className="text-xs text-surface-500">Department of Agriculture, Govt. of Jharkhand</span>
                  </div>
                </div>
                <Badge variant="primary">OFFICIAL VALIDATION</Badge>
              </div>
              <div className="p-3 rounded-xl bg-surface-50 border border-surface-200 text-xs text-surface-700 mt-2 leading-relaxed flex items-start gap-2">
                <Quote size={16} className="text-primary-600 flex-shrink-0 mt-0.5" />
                <p>{proto.governmentFeedback}</p>
              </div>
            </Card>
          )}

          {/* Citizen Community Feedback */}
          <Card padding="lg" className="border-l-4 border-l-amber-500 border border-surface-200 bg-white shadow-card-sm">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <Users size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-surface-900">
                    {prob?.citizenName || prob?.citizen_name || 'Birsa Munda Farmer SHG'}
                  </h4>
                  <span className="text-xs text-surface-500">Target Community Beneficiaries • Kanke Cluster</span>
                </div>
              </div>
              <Badge variant="warning">FIELD BENEFICIARIES</Badge>
            </div>
            <div className="p-3 rounded-xl bg-surface-50 border border-surface-200 text-xs text-surface-700 mt-2 leading-relaxed flex items-start gap-2">
              <Quote size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p>
                "The solar edge camera alerts in Hindi helped us spot the armyworm infestation 4 days before it spread across the whole plot. We only sprayed the affected rows and saved substantial costs."
              </p>
            </div>
          </Card>

          {/* Milestone Faculty Remarks */}
          {milestoneRemarks.map((fb, idx) => (
            <Card key={idx} padding="lg" className="border-l-4 border-l-purple-500 border border-surface-200 bg-white shadow-card-sm">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                    <GraduationCap size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-surface-900">{fb.author}</h4>
                    <span className="text-xs text-surface-500">{fb.role} • Milestone: {fb.milestone}</span>
                  </div>
                </div>
                <Badge variant="gray">FACULTY MENTOR</Badge>
              </div>
              <div className="p-3 rounded-xl bg-surface-50 border border-surface-200 text-xs text-surface-700 mt-2 leading-relaxed flex items-start gap-2">
                <Quote size={16} className="text-purple-600 flex-shrink-0 mt-0.5" />
                <p>{fb.text}</p>
              </div>
            </Card>
          ))}
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
