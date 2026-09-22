import React, { useState, useEffect } from 'react';
import { PageTransition } from '../../components/ui/PageTransition';
import { SectionHeader, Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Users,
  MapPin,
  Calendar,
  Layers,
  BookOpen,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { db } from '../../services/db';
import type { ResearchEntry } from '../../types';
import { ProblemEcosystemModal } from '../../components/common/ProblemEcosystemModal';
import { formatDate } from '../../lib/utils';
import { useApp } from '../../context/AppContext';

export default function FacultyResearch() {
  const { addToast } = useApp();
  const [entries, setEntries] = useState<ResearchEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProblemFilter, setSelectedProblemFilter] = useState<string>('all');
  const [selectedTraceProblemId, setSelectedTraceProblemId] = useState<string | null>(null);

  // New Research Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newProblemId, setNewProblemId] = useState('P-1030');
  const [newType, setNewType] = useState<ResearchEntry['type']>('analysis');
  const [newLocation, setNewLocation] = useState('Ranchi Cluster');
  const [newFindings, setNewFindings] = useState('');

  useEffect(() => {
    loadResearch();
  }, []);

  const loadResearch = () => {
    const list = db.getResearchEntries();
    setEntries(list);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newFindings.trim()) {
      addToast({ type: 'error', title: 'Missing fields', message: 'Please fill all required fields' });
      return;
    }
    const prob = db.getProblemById(newProblemId);
    db.addResearchEntry({
      id: `res-${Date.now()}`,
      projectId: newProblemId,
      problem_id: newProblemId,
      problemTitle: prob?.title || 'Academic Research Project',
      title: newTitle,
      type: newType,
      date: new Date().toISOString().split('T')[0],
      location: newLocation,
      participants: 25,
      findings: newFindings,
      conductedBy: 'Dr. Anita Sharma & Student Squad',
      documents: ['field-observations-v1.pdf'],
    });

    addToast({ type: 'success', title: 'Research Study Logged', message: 'Research study logged successfully!' });
    setShowAddModal(false);
    setNewTitle('');
    setNewFindings('');
    loadResearch();
  };

  const filteredEntries = entries.filter(r => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.findings.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.problem_id && r.problem_id.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesProblem =
      selectedProblemFilter === 'all' || r.problem_id === selectedProblemFilter || r.projectId === selectedProblemFilter;

    return matchesSearch && matchesProblem;
  });

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SectionHeader
            title="Faculty Research & Field Publications"
            subtitle="Empirical field observations, scientific findings, and student co-authored studies"
          />
          <Button variant="primary" onClick={() => setShowAddModal(true)} icon={<Plus size={16} />}>
            Log Field Study
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Search research studies, findings, or problem IDs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-surface-200 rounded-xl text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={selectedProblemFilter}
            onChange={e => setSelectedProblemFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-surface-200 rounded-xl text-sm text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Linked Problems</option>
            <option value="P-1030">P-1030 (Agri Pest Detection)</option>
            <option value="P-1029">P-1029 (College Transformer)</option>
            <option value="P-1028">P-1028 (Drainage Telemetry)</option>
            <option value="JH-2026-00125">JH-2026-00125 (Water Quality)</option>
          </select>
        </div>

        {/* Research List */}
        {filteredEntries.length === 0 ? (
          <Card padding="lg" className="border border-surface-200 bg-white">
            <div className="text-center py-12 text-surface-500">
              <BookOpen size={40} className="mx-auto mb-3 text-surface-400" />
              <p className="text-sm">No research studies match your current filters.</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredEntries.map(entry => (
              <Card key={entry.id} padding="lg" className="border border-surface-200 bg-white shadow-card-sm hover:shadow-card transition-all">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {entry.problem_id && (
                        <button
                          onClick={() => setSelectedTraceProblemId(entry.problem_id!)}
                          className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100 transition-colors"
                          title="Click to inspect complete Problem Lifecycle Ecosystem"
                        >
                          <Layers size={12} /> {entry.problem_id}
                        </button>
                      )}
                      <Badge variant="primary">{entry.type.toUpperCase()}</Badge>
                      {entry.problemTitle && (
                        <span className="text-xs text-surface-500 line-clamp-1 italic">
                          ({entry.problemTitle})
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-surface-900 tracking-tight">{entry.title}</h3>
                    <p className="text-sm text-surface-600 leading-relaxed">{entry.findings}</p>

                    <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-surface-500 border-t border-surface-100">
                      <span className="flex items-center gap-1 font-medium text-surface-700">
                        <Users size={13} className="text-primary-600" /> {entry.conductedBy}
                      </span>
                      {entry.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={13} className="text-surface-400" /> {entry.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={13} className="text-surface-400" /> {formatDate(entry.date)}
                      </span>
                      {entry.documents && entry.documents.length > 0 && (
                        <span className="flex items-center gap-1 text-teal-700 font-medium bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          <FileText size={13} /> {entry.documents.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {entry.problem_id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTraceProblemId(entry.problem_id!)}
                      className="self-start text-xs flex items-center gap-1"
                    >
                      <Layers size={13} /> View Trace
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* New Study Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-surface-200 rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-surface-900">Log New Field Research Study</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">Target Problem</label>
                <select
                  value={newProblemId}
                  onChange={e => setNewProblemId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="P-1030">P-1030 — Delayed Detection of Pest Outbreaks</option>
                  <option value="P-1029">P-1029 — Transformer issue in college</option>
                  <option value="P-1028">P-1028 — Urban Stormwater Drainage Clogging</option>
                  <option value="JH-2026-00125">JH-2026-00125 — Smart Drinking Water Monitoring</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">Study Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spectral reflectance analysis of fungal blight"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">Research Type</label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="analysis">Analysis</option>
                    <option value="site_visit">Site Visit</option>
                    <option value="data_collection">Data Collection</option>
                    <option value="survey">Survey</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={e => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">Scientific Findings & Empirical Summary</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe sensor telemetry, accuracy metrics, or community survey results..."
                  value={newFindings}
                  onChange={e => setNewFindings(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Save Study
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
