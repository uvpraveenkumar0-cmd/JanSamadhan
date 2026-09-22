import React, { useState } from 'react';
import { PageTransition } from '../../components/ui/PageTransition';
import { SectionHeader, Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Bell,
  Layers,
  CheckCircle2,
  Clock,
  Briefcase,
  GraduationCap,
  Sparkles,
  Building2,
  Check,
} from 'lucide-react';
import { ProblemEcosystemModal } from '../../components/common/ProblemEcosystemModal';

export default function StudentNotifications() {
  const [selectedTraceProblemId, setSelectedTraceProblemId] = useState<string | null>(null);

  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      problem_id: 'P-1030',
      title: 'Milestone 3 Approved by Faculty Mentor',
      message: 'Dr. Anita Sharma approved milestone "AI Computer Vision Model Training & Edge Deployment" with 92.4% validation mAP.',
      time: '2 hours ago',
      type: 'faculty',
      read: false,
    },
    {
      id: 'notif-2',
      problem_id: 'P-1030',
      title: 'Industry Co-Pilot Grant Ratified',
      message: 'AgriTech Jharkhand Solutions Pvt. Ltd. deposited ₹3,50,000 co-pilot funding for 50 pilot camera nodes.',
      time: '1 day ago',
      type: 'industry',
      read: false,
    },
    {
      id: 'notif-3',
      problem_id: 'P-1030',
      title: 'Government Pilot Expansion Directive',
      message: 'District Agriculture Officer, Ranchi reviewed field results and requested pilot deployment in 3 additional Panchayats.',
      time: '3 days ago',
      type: 'govt',
      read: true,
    },
  ]);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SectionHeader
            title="Ecosystem Notifications & Live Alerts"
            subtitle="Updates on milestone evaluations, corporate co-pilots, and government directives"
          />
          <Button variant="secondary" size="sm" onClick={markAllRead} className="flex items-center gap-1.5 text-xs">
            <Check size={14} /> Mark All as Read
          </Button>
        </div>

        <div className="space-y-3">
          {notifications.map(n => (
            <Card
              key={n.id}
              padding="md"
              className={`border border-surface-200 transition-all ${
                !n.read
                  ? 'border-l-4 border-l-primary-500 bg-primary-50/20 shadow-card-sm'
                  : 'bg-white opacity-80 shadow-2xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-surface-100 mt-0.5 border border-surface-200">
                    {n.type === 'faculty' ? (
                      <GraduationCap size={16} className="text-purple-600" />
                    ) : n.type === 'industry' ? (
                      <Briefcase size={16} className="text-orange-600" />
                    ) : (
                      <Building2 size={16} className="text-primary-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-surface-900">{n.title}</h4>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-primary-600" />
                      )}
                    </div>
                    <p className="text-xs text-surface-600 leading-relaxed">{n.message}</p>
                    <span className="text-[11px] text-surface-400 mt-1 block">{n.time}</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTraceProblemId(n.problem_id)}
                  className="text-xs flex items-center gap-1 flex-shrink-0"
                >
                  <Layers size={12} /> {n.problem_id} Trace
                </Button>
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
