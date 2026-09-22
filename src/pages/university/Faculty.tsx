import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Briefcase,
  Award,
  BookOpen,
  MapPin,
  Mail,
  Phone,
  Eye,
  ShieldCheck,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card, SectionHeader, StatCard, SkeletonCard } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import type { FacultyMember } from '../../types';

export default function Faculty() {
  const { user } = useApp();
  const [facultyList, setFacultyList] = useState<FacultyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyMember | null>(null);

  const univId = user?.institutionId || 'univ1';
  const univName = user?.organizationName || 'BIT Sindri';

  useEffect(() => {
    loadFaculty();
  }, [univId]);

  const loadFaculty = () => {
    setLoading(true);
    try {
      const list = db.getFaculty(univId);
      setFacultyList(list);
    } finally {
      setLoading(false);
    }
  };

  const departments = ['All', ...Array.from(new Set(facultyList.map((f) => f.department)))];

  const filteredFaculty = facultyList.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.expertise.some((e) => e.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDept = selectedDept === 'All' || f.department === selectedDept;
    const matchesStatus = selectedStatus === 'All' || f.availability_status === selectedStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const availableCount = facultyList.filter((f) => f.availability_status === 'Available').length;
  const busyCount = facultyList.filter((f) => f.availability_status === 'Busy').length;
  const totalActiveProjects = facultyList.reduce((acc, f) => acc + f.current_active_projects, 0);

  return (
    <PageTransition>
      <SectionHeader
        title="Faculty Mentorship & Research Roster"
        subtitle={`${univName} — Institutional faculty capacity, research domains, and project workload`}
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Faculty Mentors"
          value={facultyList.length}
          icon={<Users size={18} />}
          color="blue"
        />
        <StatCard
          label="Available for Assignment"
          value={availableCount}
          icon={<CheckCircle2 size={18} />}
          color="green"
        />
        <StatCard
          label="At Project Capacity"
          value={busyCount}
          icon={<Clock size={18} />}
          color="yellow"
        />
        <StatCard
          label="Active R&D Mentorships"
          value={totalActiveProjects}
          icon={<Briefcase size={18} />}
          color="teal"
        />
      </div>

      {/* Filter & Search Toolbar */}
      <Card padding="md" className="mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Search faculty name, specialization, skills..."
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

      {/* Faculty Directory Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
      ) : filteredFaculty.length === 0 ? (
        <Card padding="lg" className="text-center py-12 text-surface-400">
          <Users size={36} className="mx-auto mb-2 text-surface-300" />
          <p className="text-sm font-medium text-surface-600">No faculty members match your filter criteria.</p>
          <p className="text-xs mt-1">Try resetting the search filters above.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFaculty.map((f) => (
            <Card
              key={f.faculty_id}
              padding="md"
              className="hover:border-primary-300 hover:shadow-card-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={f.avatar}
                      alt={f.name}
                      className="w-12 h-12 rounded-xl object-cover border border-surface-200 shadow-sm"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-surface-900">{f.name}</h4>
                        <Badge variant="success" size="sm">
                          <ShieldCheck size={10} className="inline mr-0.5" /> Verified
                        </Badge>
                      </div>
                      <p className="text-xs text-surface-500">{f.designation}</p>
                      <p className="text-2xs font-mono text-primary-700">{f.department}</p>
                    </div>
                  </div>

                  <span
                    className={`text-2xs font-bold px-2 py-0.5 rounded-full border ${
                      f.availability_status === 'Available'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    ● {f.availability_status}
                  </span>
                </div>

                <div className="p-2.5 bg-surface-50 rounded-lg text-xs space-y-1 mb-3">
                  <p className="text-surface-700">
                    <strong>Specialization:</strong> {f.specialization}
                  </p>
                  <p className="text-surface-600 line-clamp-1">
                    <strong>Research:</strong> {f.research_areas.join(', ')}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap mb-3">
                  {f.expertise.slice(0, 3).map((exp, i) => (
                    <span
                      key={i}
                      className="text-2xs font-medium bg-white text-surface-600 px-2 py-0.5 rounded border border-surface-200 shadow-xs"
                    >
                      ✓ {exp}
                    </span>
                  ))}
                  {f.expertise.length > 3 && (
                    <span className="text-2xs text-surface-400">+{f.expertise.length - 3} more</span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-surface-100 flex items-center justify-between text-2xs">
                <div className="text-surface-500">
                  <span>Capacity: </span>
                  <strong className="text-surface-800">
                    {f.current_active_projects} / {f.maximum_active_projects} Active Projects
                  </strong>
                </div>

                <Button size="sm" variant="outline" icon={<Eye size={12} />} onClick={() => setSelectedFaculty(f)}>
                  View Profile
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Profile Detail Modal */}
      <Modal
        open={!!selectedFaculty}
        onClose={() => setSelectedFaculty(null)}
        title="Faculty Mentor Dossier"
      >
        {selectedFaculty && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 pb-3 border-b border-surface-100">
              <img
                src={selectedFaculty.avatar}
                alt={selectedFaculty.name}
                className="w-14 h-14 rounded-2xl object-cover border border-surface-200 shadow"
              />
              <div>
                <h3 className="text-base font-bold text-surface-900">{selectedFaculty.name}</h3>
                <p className="text-xs text-surface-500">{selectedFaculty.designation}</p>
                <p className="text-xs text-primary-700 font-medium">{selectedFaculty.department}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 bg-surface-50 rounded-lg">
                <span className="text-surface-400 text-2xs">Experience</span>
                <p className="font-bold text-surface-800 mt-0.5">{selectedFaculty.years_of_experience} Years Academic R&D</p>
              </div>
              <div className="p-2.5 bg-surface-50 rounded-lg">
                <span className="text-surface-400 text-2xs">Qualification</span>
                <p className="font-bold text-surface-800 mt-0.5">{selectedFaculty.qualification}</p>
              </div>
              <div className="p-2.5 bg-surface-50 rounded-lg">
                <span className="text-surface-400 text-2xs">Contact Email</span>
                <p className="font-bold text-surface-800 mt-0.5">{selectedFaculty.email}</p>
              </div>
              <div className="p-2.5 bg-surface-50 rounded-lg">
                <span className="text-surface-400 text-2xs">Workload</span>
                <p className="font-bold text-surface-800 mt-0.5">
                  {selectedFaculty.current_active_projects} of {selectedFaculty.maximum_active_projects} Max Active
                </p>
              </div>
            </div>

            <div>
              <span className="font-bold text-surface-700 block mb-1">Domain Expertise & Skills:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedFaculty.technical_skills.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-200 text-2xs font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="font-bold text-surface-700 block mb-1">Research Areas:</span>
              <p className="text-surface-600 bg-surface-50 p-2.5 rounded-lg border border-surface-100">
                {selectedFaculty.research_areas.join(' · ')}
              </p>
            </div>

            <div className="flex justify-end pt-3 border-t border-surface-100">
              <Button variant="outline" size="sm" onClick={() => setSelectedFaculty(null)}>
                Close Dossier
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}
