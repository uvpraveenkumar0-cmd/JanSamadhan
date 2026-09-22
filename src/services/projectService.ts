import type { Project, Team, Task, ResearchEntry, Prototype, Milestone } from '../types';
import { DEMO_PROJECT, DEMO_TEAM, DEMO_PROTOTYPE } from '../data/mockData';
import { db } from './db';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

const PROJECTS_KEY = 'jansamadhan_projects';

function getProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const initial = [DEMO_PROJECT];
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(initial));
  return initial;
}

function saveProjects(p: Project[]) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(p));
}

export const projectService = {
  async getAll(): Promise<Project[]> {
    await delay(300);
    const assignments = db.getProjectAssignments();
    if (assignments.length > 0) {
      return assignments.map(a => {
        const prob = db.getProblemById(a.problem_id);
        return {
          id: a.problem_id,
          problemId: a.problem_id,
          title: prob?.title || a.team_name,
          category: prob?.category || 'General',
          description: prob?.description || '',
          assignedTo: a.team_name,
          assignedUniversity: a.university_name || 'BIT Sindri',
          leadFaculty: a.faculty_name,
          status: a.project_status === 'PROJECT_ACTIVE' ? 'in_progress' : 'planning',
          progress: a.progress || 50,
          startDate: a.assigned_at,
          targetCompletionDate: '2026-11-30',
          budget: 500000,
          budgetUtilized: Math.round((a.progress / 100) * 400000),
          milestones: (a.milestones || []).map(m => ({
            id: m.id,
            projectId: a.problem_id,
            phase: 'prototype' as const,
            title: m.title,
            description: m.description,
            status: m.status === 'approved' ? 'completed' as const : m.status === 'in_progress' ? 'in_progress' as const : 'pending' as const,
            dueDate: m.due_date,
            progress: m.progress_percentage || 0,
            documents: [],
            comments: [],
            deliverables: m.deliverables || [],
          })),
          tags: prob?.tags || [],
        } as unknown as Project;
      });
    }
    return getProjects();
  },

  async getById(id: string): Promise<Project | null> {
    await delay(200);
    const all = await this.getAll();
    return all.find(p => p.id === id || p.problemId === id) ?? getProjects().find(p => p.id === id) ?? null;
  },

  async getTeam(projectId: string): Promise<Team | null> {
    await delay(200);
    const asgn = db.getProjectAssignmentByProblemId(projectId) || db.getProjectAssignments()[0];
    if (asgn) {
      const studentTeam = db.getStudentTeamById(asgn.team_id);
      if (studentTeam) {
        return {
          id: studentTeam.team_id,
          projectId: asgn.problem_id,
          name: studentTeam.team_name,
          createdAt: '2026-08-26',
          members: (studentTeam.team_members || []).map(m => ({
            studentId: m.student_id,
            student: {
              id: m.student_id,
              name: m.name,
              email: m.email,
              phone: '',
              universityId: 'univ1',
              department: m.department,
              year: m.year,
              skills: m.skills || [],
              role: m.role,
              verified: true,
            } as any,
            role: m.role,
            joinedAt: '2026-08-26',
            tasks: [],
          })),
        };
      }
    }
    if (projectId === 'proj-001') return DEMO_TEAM;
    return DEMO_TEAM;
  },

  async getTasks(projectId: string): Promise<Task[]> {
    await delay(200);
    const dbTasks = db.getTasks(projectId);
    if (dbTasks && dbTasks.length > 0) {
      return dbTasks;
    }
    // Return all tasks if projectId is not found or matches P-1030
    const allTasks = db.getTasks();
    if (allTasks && allTasks.length > 0) return allTasks;
    return [];
  },

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    await delay(150);
    const updated = db.updateTask(taskId, updates);
    if (updated) return updated;
    return { id: taskId, ...updates } as Task;
  },

  async getResearch(projectId: string): Promise<ResearchEntry[]> {
    await delay(200);
    const dbEntries = db.getResearchEntries(projectId);
    if (dbEntries && dbEntries.length > 0) {
      return dbEntries;
    }
    const all = db.getResearchEntries();
    return all.length > 0 ? all : [];
  },

  async getPrototype(projectId: string): Promise<Prototype | null> {
    await delay(200);
    const proto = db.getPrototypeByProblemId(projectId);
    if (proto) return proto;
    const allProtos = db.getPrototypes();
    if (allProtos.length > 0) return allProtos[0];
    return DEMO_PROTOTYPE;
  },

  async updateMilestone(projectId: string, milestoneId: string, updates: Partial<Milestone>): Promise<Project> {
    await delay(200);
    const asgn = db.getProjectAssignmentByProblemId(projectId);
    if (asgn && asgn.milestones) {
      const idx = asgn.milestones.findIndex(m => m.id === milestoneId);
      if (idx !== -1) {
        asgn.milestones[idx] = {
          ...asgn.milestones[idx],
          status: updates.status === 'completed' ? 'approved' : updates.status === 'in_progress' ? 'in_progress' : 'pending',
          progress_percentage: updates.progress ?? asgn.milestones[idx].progress_percentage,
        };
        db.updateProjectAssignment(asgn.assignment_id, { milestones: asgn.milestones });
      }
    }
    return this.getById(projectId) as Promise<Project>;
  },
};
