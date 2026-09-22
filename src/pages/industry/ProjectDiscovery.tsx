import React, { useState, useEffect } from 'react';
import { PageTransition } from '../../components/ui/PageTransition';
import { SectionHeader, Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Layers,
  Search,
  Filter,
  Building2,
  GraduationCap,
  Users,
  Handshake,
  DollarSign,
  Cpu,
  MapPin,
} from 'lucide-react';
import { db } from '../../services/db';
import type { Problem, ProjectAssignment, Prototype } from '../../types';
import { ProblemEcosystemModal } from '../../components/common/ProblemEcosystemModal';
import { useApp } from '../../context/AppContext';

export default function IndustryProjectDiscovery() {
  const { addToast } = useApp();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [selectedTraceProblemId, setSelectedTraceProblemId] = useState<string | null>(null);

  // Proposal modal
  const [proposingProblem, setProposingProblem] = useState<Problem | null>(null);
  const [corporateName, setCorporateName] = useState('Tata Steel Innovation Hub');
  const [offeredAmount, setOfferedAmount] = useState('₹3,00,000');
  const [proposalNotes, setProposalNotes] = useState('');

  useEffect(() => {
    const list = db.getProblems();
    // Filter to active civic problems with assignments
    setProblems(list);
  }, []);

  const handlePropose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposingProblem) return;

    db.createIndustryCollaboration({
      id: `ind-${Date.now()}`,
      projectId: proposingProblem.id,
      problem_id: proposingProblem.id,
      project: proposingProblem.title,
      industryPartnerId: `partner-${Date.now()}`,
      industryPartner: corporateName,
      requestType: ['funding', 'testing'],
      status: 'pending',
      requestedAt: new Date().toISOString(),
      message: `Offered co-pilot grant ${offeredAmount}. ${proposalNotes}`,
    });

    addToast({
      type: 'success',
      title: 'Proposal Dispatched',
      message: `Collaboration proposal dispatched to ${proposingProblem.assigned_university_name || 'BIT Sindri'}!`,
    });
    setProposingProblem(null);
    setProposalNotes('');
  };

  const filteredProblems = problems.filter(p => {
    const matchesSearch =
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDomain =
      domainFilter === 'all' ||
      p.domain === domainFilter ||
      (p.category && p.category.toLowerCase().includes(domainFilter.toLowerCase()));

    return matchesSearch && matchesDomain;
  });

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SectionHeader
            title="Discover Civic Technology Projects"
            subtitle="Explore real problems solved by university squads and sponsor field testing, prototypes, or scaling"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Search by keyword, problem ID, domain..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-surface-200 rounded-xl text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={domainFilter}
            onChange={e => setDomainFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-surface-200 rounded-xl text-sm text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Civic Domains</option>
            <option value="agriculture">Agriculture & Crop Protection</option>
            <option value="energy">Energy & Smart Grids</option>
            <option value="water">Water & Sanitation</option>
            <option value="infrastructure">Urban Infrastructure</option>
          </select>
        </div>

        {/* Problem Discovery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredProblems.map(prob => {
            const proto = db.getPrototypeByProblemId(prob.id);
            const asgn = db.getProjectAssignmentByProblemId(prob.id);

            return (
              <Card key={prob.id} padding="lg" className="flex flex-col justify-between border border-surface-200 bg-white shadow-card-sm hover:shadow-card transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSelectedTraceProblemId(prob.id)}
                      className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100 transition-colors"
                    >
                      <Layers size={11} /> {prob.id}
                    </button>
                    <Badge variant="primary">{prob.category}</Badge>
                  </div>

                  <h3 className="text-base font-bold text-surface-900 tracking-tight">{prob.title}</h3>
                  <p className="text-xs text-surface-600 line-clamp-3 leading-relaxed">{prob.description}</p>

                  <div className="p-3 rounded-xl bg-surface-50 border border-surface-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-surface-500">University Custodian:</span>
                      <strong className="text-surface-900">{prob.assigned_university_name || 'BIT Sindri'}</strong>
                    </div>
                    {asgn && (
                      <div className="flex items-center justify-between">
                        <span className="text-surface-500">Student Squad:</span>
                        <strong className="text-emerald-700">{asgn.team_name}</strong>
                      </div>
                    )}
                    {proto && (
                      <div className="flex items-center justify-between pt-1 border-t border-surface-200">
                        <span className="text-surface-500">TRL Hardware Readiness:</span>
                        <span className="font-mono font-bold text-primary-700">{proto.readinessScore}% ({proto.version})</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-surface-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTraceProblemId(prob.id)}
                    className="text-xs flex items-center gap-1"
                  >
                    <Layers size={13} /> Inspect Ecosystem
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setProposingProblem(prob)}
                    className="text-xs flex items-center gap-1"
                  >
                    <Handshake size={13} /> Propose Co-Pilot
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Proposal Modal */}
      {proposingProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-surface-200 rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-surface-900">Sponsor / Co-Pilot Proposal</h3>
            <p className="text-xs text-surface-500">{proposingProblem.title} ({proposingProblem.id})</p>

            <form onSubmit={handlePropose} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">Your Organization Name</label>
                <input
                  type="text"
                  required
                  value={corporateName}
                  onChange={e => setCorporateName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">Co-Pilot Grant / Hardware Provision</label>
                <input
                  type="text"
                  required
                  value={offeredAmount}
                  onChange={e => setOfferedAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">Joint Collaboration Scope</label>
                <textarea
                  rows={3}
                  placeholder="Detail testing access, sensor supply, or manufacturing assistance..."
                  value={proposalNotes}
                  onChange={e => setProposalNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" type="button" onClick={() => setProposingProblem(null)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Dispatch Proposal
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
