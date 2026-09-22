import React, { useState, useEffect } from 'react';
import { PageTransition } from '../../components/ui/PageTransition';
import { SectionHeader, Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Cpu,
  Layers,
  CheckCircle2,
  Clock,
  ExternalLink,
  Edit3,
  Sliders,
  ShieldCheck,
  Building2,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { db } from '../../services/db';
import type { Prototype } from '../../types';
import { ProblemEcosystemModal } from '../../components/common/ProblemEcosystemModal';
import { useApp } from '../../context/AppContext';

export default function FacultyPrototypes() {
  const { addToast } = useApp();
  const [prototypes, setPrototypes] = useState<Prototype[]>([]);
  const [selectedTraceProblemId, setSelectedTraceProblemId] = useState<string | null>(null);

  // Evaluation Modal
  const [evaluatingProto, setEvaluatingProto] = useState<Prototype | null>(null);
  const [newScore, setNewScore] = useState(80);
  const [newStatus, setNewStatus] = useState<Prototype['status']>('testing');
  const [facultyFeedback, setFacultyFeedback] = useState('');

  useEffect(() => {
    loadPrototypes();
  }, []);

  const loadPrototypes = () => {
    const list = db.getPrototypes();
    setPrototypes(list);
  };

  const handleOpenEvaluation = (p: Prototype) => {
    setEvaluatingProto(p);
    setNewScore(p.readinessScore);
    setNewStatus(p.status);
    setFacultyFeedback(p.governmentFeedback || '');
  };

  const handleSaveEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingProto) return;

    db.updatePrototype(evaluatingProto.id, {
      readinessScore: newScore,
      status: newStatus,
      governmentFeedback: facultyFeedback,
    });

    addToast({
      type: 'success',
      title: 'Evaluation Recorded',
      message: `Prototype ${evaluatingProto.version} evaluation recorded!`,
    });
    setEvaluatingProto(null);
    loadPrototypes();
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SectionHeader
            title="Prototype Engineering & Field Validation"
            subtitle="Evaluate TRL readiness scores, hardware telemetry nodes, and field pilot trials"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {prototypes.map(proto => (
            <Card key={proto.id} padding="lg" className="flex flex-col justify-between border border-surface-200 bg-white shadow-card-sm hover:shadow-card transition-all">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {proto.problem_id && (
                        <button
                          onClick={() => setSelectedTraceProblemId(proto.problem_id!)}
                          className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100 transition-colors"
                          title="Click to inspect complete Problem Lifecycle Ecosystem"
                        >
                          <Layers size={11} /> {proto.problem_id}
                        </button>
                      )}
                      <span className="text-xs font-mono text-primary-700 font-bold bg-primary-50 px-2 py-0.5 rounded border border-primary-200">{proto.version}</span>
                      <Badge variant={proto.status === 'field_pilot' ? 'success' : proto.status === 'testing' ? 'warning' : 'primary'}>
                        {proto.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <h3 className="text-base font-bold text-surface-900 tracking-tight">{proto.title}</h3>
                  </div>

                  {/* Readiness Circular / Percentage Score */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-black font-mono text-primary-700">{proto.readinessScore}%</div>
                    <span className="text-[10px] text-surface-500 uppercase tracking-wider font-semibold">TRL Readiness</span>
                  </div>
                </div>

                <p className="text-xs text-surface-600 leading-relaxed">{proto.description}</p>

                {/* Tech Stack Badges */}
                <div className="flex flex-wrap gap-1.5">
                  {proto.techStack.map((tech, i) => (
                    <span key={i} className="px-2 py-0.5 rounded text-[11px] bg-surface-100 text-surface-700 border border-surface-200 font-medium">
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Architecture */}
                {proto.architecture && (
                  <div className="p-2.5 rounded-lg bg-surface-50 border border-surface-200 text-[11px] font-mono text-surface-800 leading-normal">
                    <strong className="text-surface-900 font-sans">Hardware Telemetry Stack: </strong>
                    {proto.architecture}
                  </div>
                )}

                {/* Field Testing & Official Feedback */}
                {proto.fieldTestingStatus && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 leading-relaxed">
                    <strong className="font-semibold text-emerald-900">Field Trial Status: </strong>
                    {proto.fieldTestingStatus}
                  </div>
                )}

                {proto.governmentFeedback && (
                  <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800 leading-relaxed">
                    <strong className="font-semibold text-blue-900">Institutional Feedback: </strong>
                    {proto.governmentFeedback}
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-surface-100">
                <span className="text-[11px] text-surface-400">
                  Updated: {proto.updatedAt ? proto.updatedAt.split('T')[0] : 'Recent'}
                </span>
                <div className="flex items-center gap-2">
                  {proto.problem_id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTraceProblemId(proto.problem_id!)}
                      className="text-xs flex items-center gap-1"
                    >
                      <Layers size={13} /> Trace Ecosystem
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenEvaluation(proto)}
                    className="text-xs flex items-center gap-1"
                  >
                    <Sliders size={13} /> Evaluate TRL
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Evaluation Modal */}
      {evaluatingProto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-surface-200 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-surface-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-surface-900">Faculty TRL Assessment</h3>
                <span className="text-xs text-surface-500">{evaluatingProto.title} ({evaluatingProto.version})</span>
              </div>
            </div>

            <form onSubmit={handleSaveEvaluation} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-surface-700">TRL Readiness Score</label>
                  <span className="text-sm font-mono font-bold text-primary-700">{newScore}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={newScore}
                  onChange={e => setNewScore(Number(e.target.value))}
                  className="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">Development Phase</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="development">Development (Lab Bench)</option>
                  <option value="testing">Testing (Functional Simulation)</option>
                  <option value="field_pilot">Field Pilot (Real Marginal Environment)</option>
                  <option value="ready">Production Ready</option>
                  <option value="deployed">Deployed & Scaled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">Faculty Mentor Evaluation & Review</label>
                <textarea
                  rows={3}
                  placeholder="Record sensor calibration notes, safety checks, or field readiness certification..."
                  value={facultyFeedback}
                  onChange={e => setFacultyFeedback(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" type="button" onClick={() => setEvaluatingProto(null)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Save Evaluation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lifecycle Trace Modal */}
      <ProblemEcosystemModal
        problemId={selectedTraceProblemId}
        isOpen={!!selectedTraceProblemId}
        onClose={() => setSelectedTraceProblemId(null)}
      />
    </PageTransition>
  );
}
