import React, {
  useEffect, useRef, useState, useCallback
} from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, CheckCircle2, Globe2, Users, Building2,
  Cpu, Leaf, Droplets, Zap, Heart, BookOpen, Trash2, Wind,
  Wifi, Home, Handshake,
  FlaskConical, Rocket, TrendingUp, ShieldCheck, MapPin,
  X, Menu, ChevronUp
} from 'lucide-react';
import { AnimatedCounter } from '../components/ui/Progress';
import { cn } from '../lib/utils';

import { RoleAuthModal } from '../components/ui/RoleAuthModal';
import type { EcoRoleKey } from '../components/ui/RoleAuthModal';

// â”€â”€â”€ Theme System â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const THEMES = ['aurora', 'horizon', 'orbit', 'terra', 'pulse'] as const;
type Theme = typeof THEMES[number];

const THEME_META: Record<Theme, { label: string; dot: string; tooltip: string }> = {
  aurora:  { label: 'Aurora',  dot: '#5e6ad2', tooltip: 'Aurora â€” Crisp & Minimal' },
  horizon: { label: 'Horizon', dot: '#635bff', tooltip: 'Horizon â€” Bold & Confident' },
  orbit:   { label: 'Orbit',   dot: '#0a84ff', tooltip: 'Orbit â€” Glassy & Futuristic' },
  terra:   { label: 'Terra',   dot: '#e07a3e', tooltip: 'Terra â€” Warm & Editorial' },
  pulse:   { label: 'Pulse',   dot: '#ff6b9d', tooltip: 'Pulse â€” Playful & Energetic' },
};

function getStoredTheme(): Theme {
  try {
    const t = localStorage.getItem('jih-theme') as Theme;
    if (t && THEMES.includes(t)) return t;
  } catch {}
  return 'aurora';
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem('jih-theme', theme); } catch {}
}

// â”€â”€â”€ Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type RoleKey = 'citizen' | 'government' | 'university' | 'faculty' | 'company';

const ROLES: {
  key: RoleKey;
  label: string;
  icon: React.ElementType;
  desc: string;
  color: string;
  accent: string;
}[] = [
  {
    key: 'citizen', label: 'Citizen', icon: Users,
    desc: 'Submit community problems and track their resolution journey',
    color: '#22c55e', accent: 'rgba(34,197,94,0.15)',
  },
  {
    key: 'government', label: 'Government', icon: ShieldCheck,
    desc: 'Verify problems, allocate universities, and monitor impact',
    color: '#3b82f6', accent: 'rgba(59,130,246,0.15)',
  },
  {
    key: 'university', label: 'University', icon: Building2,
    desc: 'Browse and accept problems, manage faculty and student teams',
    color: '#0ea5e9', accent: 'rgba(14,165,233,0.15)',
  },
  {
    key: 'faculty', label: 'Faculty', icon: BookOpen,
    desc: 'Guide student teams through research, prototyping, and deployment',
    color: '#a855f7', accent: 'rgba(168,85,247,0.15)',
  },
  {
    key: 'company', label: 'Industry', icon: Handshake,
    desc: 'Discover projects, offer mentorship, funding, and deployment support',
    color: '#f59e0b', accent: 'rgba(245,158,11,0.15)',
  },
];

const IMPACT_STATS = [
  {
    id: 'problems', num: '01', value: 12450, label: 'Problems Identified', suffix: '+',
    breakdown: [
      { cat: 'Water Management', val: 2240, pct: 18 },
      { cat: 'Agriculture',      val: 2190, pct: 18 },
      { cat: 'Healthcare',       val: 1780, pct: 14 },
      { cat: 'Education',        val: 1560, pct: 13 },
      { cat: 'Sanitation',       val: 1120, pct: 9  },
      { cat: 'Others',           val: 3560, pct: 28 },
    ],
    explanation: 'Community problems submitted across all 24 districts of Jharkhand since platform launch.',
  },
  {
    id: 'teams', num: '02', value: 3820, label: 'Student Teams', suffix: '+',
    breakdown: [
      { cat: 'BIT Sindri',      val: 820,  pct: 21 },
      { cat: 'NIT Jamshedpur',  val: 710,  pct: 19 },
      { cat: 'XLRI',            val: 380,  pct: 10 },
      { cat: 'Ranchi Univ.',    val: 610,  pct: 16 },
      { cat: 'Other Univ.',     val: 1300, pct: 34 },
    ],
    explanation: 'Multidisciplinary student teams from 38 universities across Jharkhand.',
  },
  {
    id: 'solutions', num: '03', value: 1240, label: 'Solutions Deployed', suffix: '+',
    breakdown: [
      { cat: 'Pilot Stage', val: 320, pct: 26 },
      { cat: 'Deployed',    val: 580, pct: 47 },
      { cat: 'Validated',   val: 340, pct: 27 },
    ],
    explanation: 'Solutions that have moved from prototype to actual deployment in communities.',
  },
  {
    id: 'communities', num: '04', value: 85, label: 'Communities Impacted', suffix: '+',
    breakdown: [
      { cat: 'Rural Villages', val: 42, pct: 49 },
      { cat: 'Urban Wards',    val: 28, pct: 33 },
      { cat: 'Tribal Areas',   val: 15, pct: 18 },
    ],
    explanation: 'Distinct communities that have directly benefited from deployed solutions.',
  },
];

const DOMAINS = [
  { icon: Droplets,  label: 'Water Management', count: 187, emoji: 'ðŸ’§' },
  { icon: Heart,     label: 'Healthcare',        count: 142, emoji: 'â¤ï¸' },
  { icon: Leaf,      label: 'Agriculture',       count: 198, emoji: 'ðŸŒ±' },
  { icon: Trash2,    label: 'Sanitation',        count: 73,  emoji: 'ðŸ—‘ï¸' },
  { icon: Wind,      label: 'Environment',       count: 94,  emoji: 'ðŸŒ¬ï¸' },
  { icon: Zap,       label: 'Energy',            count: 89,  emoji: 'âš¡' },
  { icon: BookOpen,  label: 'Education',         count: 156, emoji: 'ðŸ“š' },
  { icon: Home,      label: 'Rural Livelihoods', count: 112, emoji: 'ðŸ ' },
  { icon: Wifi,      label: 'Accessibility',     count: 45,  emoji: 'ðŸ“¶' },
  { icon: Building2, label: 'Infrastructure',    count: 61,  emoji: 'ðŸ—ï¸' },
  { icon: Globe2,    label: 'Public Services',   count: 89,  emoji: 'ðŸŒ' },
];

const STEPS = [
  { step: 1, icon: MapPin,       label: 'Report',      desc: 'Citizens submit community problems via the platform or mobile app' },
  { step: 2, icon: ShieldCheck,  label: 'Verify',      desc: 'Government officers verify, categorize & prioritize submissions' },
  { step: 3, icon: Cpu,          label: 'AI Match',    desc: 'AI engine matches problems to best-fit universities & researchers' },
  { step: 4, icon: BookOpen,     label: 'Allocate',    desc: 'University admins formally accept and form student research teams' },
  { step: 5, icon: FlaskConical, label: 'Research',    desc: 'Student teams conduct field research, data collection & analysis' },
  { step: 6, icon: Handshake,    label: 'Collaborate', desc: 'Industry provides mentorship, domain expertise & funding support' },
  { step: 7, icon: Rocket,       label: 'Deploy',      desc: 'Solutions piloted in target communities with real-world testing' },
  { step: 8, icon: TrendingUp,   label: 'Measure',     desc: 'Government validates impact; citizens benefit from working solutions' },
];

// â”€â”€â”€ Theme CSS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const THEME_CSS = `
:root,[data-theme="aurora"]{--bg-primary:#0a0a0f;--bg-surface:rgba(20,20,28,.6);--bg-surface2:rgba(30,30,42,.9);--border:rgba(255,255,255,.08);--border-h:rgba(255,255,255,.18);--radius:12px;--radius-lg:20px;--blur:12px;--accent-1:#5e6ad2;--accent-2:#5e6ad2;--accent-glow:rgba(94,106,210,.22);--text-1:#f4f4f6;--text-2:#9a9aa5;--text-m:#6b6b75;--shadow:0 4px 24px rgba(0,0,0,.45);--shadow-lg:0 8px 48px rgba(0,0,0,.65);}
[data-theme="horizon"]{--bg-primary:#0a2540;--bg-surface:rgba(10,37,64,.7);--bg-surface2:rgba(8,28,50,.95);--border:rgba(99,91,255,.2);--border-h:rgba(99,91,255,.45);--radius:10px;--radius-lg:16px;--blur:16px;--accent-1:#635bff;--accent-2:#00d4ff;--accent-glow:rgba(99,91,255,.3);--text-1:#fff;--text-2:#94a3b8;--text-m:#64748b;--shadow:0 4px 32px rgba(99,91,255,.18);--shadow-lg:0 12px 60px rgba(99,91,255,.28);}
[data-theme="orbit"]{--bg-primary:#000;--bg-surface:rgba(255,255,255,.06);--bg-surface2:rgba(255,255,255,.1);--border:rgba(255,255,255,.12);--border-h:rgba(255,255,255,.28);--radius:28px;--radius-lg:36px;--blur:30px;--accent-1:#0a84ff;--accent-2:#5e5ce6;--accent-glow:rgba(10,132,255,.28);--text-1:#f5f5f7;--text-2:#86868b;--text-m:#636366;--shadow:0 8px 40px rgba(0,0,0,.6);--shadow-lg:0 20px 80px rgba(0,0,0,.8);}
[data-theme="terra"]{--bg-primary:#faf9f6;--bg-surface:rgba(250,249,246,.92);--bg-surface2:rgba(255,255,255,.97);--border:rgba(0,0,0,.08);--border-h:rgba(0,0,0,.18);--radius:8px;--radius-lg:14px;--blur:8px;--accent-1:#2f2f2f;--accent-2:#e07a3e;--accent-glow:rgba(224,122,62,.18);--text-1:#1a1a1a;--text-2:#6b7280;--text-m:#9ca3af;--shadow:0 2px 16px rgba(0,0,0,.08);--shadow-lg:0 8px 40px rgba(0,0,0,.12);}
[data-theme="pulse"]{--bg-primary:#12081f;--bg-surface:rgba(30,15,50,.7);--bg-surface2:rgba(40,20,65,.88);--border:rgba(255,107,157,.2);--border-h:rgba(255,107,157,.42);--radius:20px;--radius-lg:28px;--blur:20px;--accent-1:#ff6b9d;--accent-2:#4facfe;--accent-glow:rgba(255,107,157,.25);--text-1:#fff;--text-2:#c4b5d4;--text-m:#7c6b8e;--shadow:0 4px 32px rgba(255,107,157,.18);--shadow-lg:0 12px 60px rgba(79,172,254,.22);}

.jih-bg{background-color:var(--bg-primary);color:var(--text-1);transition:background-color .2s,color .2s;}
.jih-surface{background:var(--bg-surface);backdrop-filter:blur(var(--blur));border:1px solid var(--border);border-radius:var(--radius);}
.jih-card{background:var(--bg-surface);backdrop-filter:blur(var(--blur));border:1px solid var(--border);border-radius:var(--radius);transition:border-color .18s,box-shadow .18s,transform .18s;}
.jih-card:hover{border-color:var(--border-h);box-shadow:var(--shadow);transform:translateY(-2px);}
.jih-accent-text{background:linear-gradient(135deg,var(--accent-1),var(--accent-2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.jih-btn-pri{background:linear-gradient(135deg,var(--accent-1),var(--accent-2));color:#fff;border:none;border-radius:var(--radius);font-weight:600;cursor:pointer;transition:all .18s;}
.jih-btn-pri:hover{opacity:.9;transform:translateY(-1px);box-shadow:0 4px 20px var(--accent-glow);}
.jih-btn-pri:disabled{opacity:.6;cursor:not-allowed;transform:none;}
.jih-btn-ghost{background:var(--bg-surface);color:var(--text-1);border:1px solid var(--border);border-radius:var(--radius);font-weight:500;cursor:pointer;backdrop-filter:blur(var(--blur));transition:all .18s;}
.jih-btn-ghost:hover{border-color:var(--border-h);transform:translateY(-1px);}

.sr-init{opacity:0;transform:translateY(22px);}
.sr-done{opacity:1;transform:translateY(0);transition:opacity .55s cubic-bezier(0,0,.2,1),transform .55s cubic-bezier(0,0,.2,1);}

.particles-canvas{position:absolute;inset:0;pointer-events:none;z-index:0;width:100%;height:100%;}
@media(prefers-reduced-motion:reduce){.particles-canvas{display:none;}}

@keyframes toastIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
.jih-toast-anim{animation:toastIn .22s ease-out;}
`;

function injectCSS() {
  if (document.getElementById('jih-v2-css')) return;
  const s = document.createElement('style');
  s.id = 'jih-v2-css';
  s.textContent = THEME_CSS;
  document.head.appendChild(s);
}

// â”€â”€â”€ Shared Scroll Observer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

let _obs: IntersectionObserver | null = null;
function getScrollObserver() {
  if (!_obs) {
    _obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).classList.remove('sr-init');
          (e.target as HTMLElement).classList.add('sr-done');
        }
      }),
      { threshold: 0.08, rootMargin: '-30px 0px' }
    );
  }
  return _obs;
}

function SR({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transitionDelay = `${delay}s`;
    el.classList.add('sr-init');
    const obs = getScrollObserver();
    obs.observe(el);
    return () => obs.unobserve(el);
  }, [delay]);
  return <div ref={ref} className={className}>{children}</div>;
}

// â”€â”€â”€ Particles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ParticlesCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const resize = () => { cv.width = cv.offsetWidth; cv.height = cv.offsetHeight; };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cv);
    const pts = Array.from({ length: 40 }, () => ({
      x: Math.random() * cv.width, y: Math.random() * cv.height,
      r: Math.random() * 1.4 + 0.3,
      vx: (Math.random() - .5) * .15, vy: (Math.random() - .5) * .15,
      a: Math.random() * .3 + .05,
    }));
    let raf: number, t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      const ac = getComputedStyle(document.documentElement).getPropertyValue('--accent-1').trim() || '#5e6ad2';
      t++;
      pts.forEach(p => {
        p.x = (p.x + p.vx + cv.width) % cv.width;
        p.y = (p.y + p.vy + cv.height) % cv.height;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = ac;
        ctx.globalAlpha = p.a * (.6 + .4 * Math.sin(t * .01 + p.x));
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={canvasRef} className="particles-canvas" aria-hidden="true" />;
}

// â”€â”€â”€ Theme Switcher â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ThemeSwitcher({ current, onChange }: { current: Theme; onChange: (t: Theme) => void }) {
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Select color theme">
      {THEMES.map(t => (
        <button
          key={t}
          title={THEME_META[t].tooltip}
          aria-label={`${THEME_META[t].label} theme${current === t ? ' (active)' : ''}`}
          aria-pressed={current === t}
          onClick={() => onChange(t)}
          className="w-4 h-4 rounded-full transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{
            backgroundColor: THEME_META[t].dot,
            opacity: current === t ? 1 : 0.38,
            transform: current === t ? 'scale(1.28)' : 'scale(1)',
            outline: current === t ? `2px solid ${THEME_META[t].dot}` : 'none',
            outlineOffset: 2,
          }}
        />
      ))}
    </div>
  );
}

// --- Stat Breakdown Modal ---

type ModalPayload = { type: 'stat'; statId: string };

function JIHModal({ payload, onClose }: {
  payload: ModalPayload;
  onClose: () => void;
}) {
  const stat = IMPACT_STATS.find(s => s.id === payload.statId);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    (el.querySelector('button') as HTMLElement | null)?.focus();
  }, []);

  if (!stat) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(14px)', background: 'rgba(0,0,0,.72)' }}
      onClick={onClose}
    >
      <motion.div
        ref={boxRef}
        initial={{ opacity: 0, scale: .9, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: .9, y: 14 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="w-full max-w-md outline-none"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stat-modal-title"
        style={{
          background: 'var(--bg-surface2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 id="stat-modal-title" className="font-semibold text-base" style={{ color: 'var(--text-1)' }}>
            {stat.label}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-colors"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-2)', borderRadius: 'var(--radius)' }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="text-center py-2">
            <p className="text-4xl font-extrabold jih-accent-text">{stat.value.toLocaleString()}{stat.suffix}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>{stat.label}</p>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>{stat.explanation}</p>
          <div className="space-y-3">
            {stat.breakdown.map(item => (
              <div key={item.cat}>
                <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-2)' }}>
                  <span>{item.cat}</span>
                  <span className="font-semibold" style={{ color: 'var(--text-1)' }}>
                    {item.val.toLocaleString()} ({item.pct}%)
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg,var(--accent-1),var(--accent-2))' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ duration: .8, ease: [0, 0, .2, 1], delay: .15 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// â”€â”€â”€ Ecosystem Orbit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function EcosystemOrbit({ onRoleClick }: { onRoleClick: (k: RoleKey) => void }) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [rotation, setRotation] = useState(0);
  const rotRef = useRef(0);
  const rafRef = useRef<number>(0);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef(ROLES.map((_, i) => i / ROLES.length));

  const getOrbitR = () => {
    const w = wrapRef.current?.offsetWidth ?? 480;
    return w * (window.innerWidth <= 600 ? 0.35 : 0.4);
  };
  const getNodeR = () => (window.innerWidth <= 600 ? 28 : window.innerWidth <= 900 ? 36 : 42);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const w = wrapRef.current;
      if (!w) return;
      cv.width = w.offsetWidth;
      cv.height = w.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (wrapRef.current) ro.observe(wrapRef.current);

    let frameCount = 0;
    const draw = () => {
      const w = cv.width, h = cv.height, cx = w / 2, cy = h / 2;
      ctx.clearRect(0, 0, w, h);
      if (!paused) rotRef.current += .0018;

      // Update rotation state every 4 frames to avoid excessive re-renders
      frameCount++;
      if (frameCount % 4 === 0) {
        setRotation(rotRef.current);
      }

      const accent = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent-1').trim() || '#5e6ad2';
      const or = getOrbitR();
      const nr = getNodeR();

      // Orbit ring
      ctx.beginPath(); ctx.arc(cx, cy, or, 0, Math.PI * 2);
      ctx.strokeStyle = `${accent}28`; ctx.lineWidth = 1; ctx.stroke();

      // Connectors & particles
      ROLES.forEach((_, i) => {
        const ang = i * (2 * Math.PI / ROLES.length) + rotRef.current;
        const nx = cx + Math.cos(ang) * or, ny = cy + Math.sin(ang) * or;
        const isAct = activeIdx === i, isDim = activeIdx !== null && !isAct;

        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(nx, ny);
        ctx.strokeStyle = isAct ? `${accent}80` : `${accent}22`;
        ctx.lineWidth = isAct ? 1.5 : .8; ctx.stroke();

        phaseRef.current[i] = (phaseRef.current[i] + .0038) % 1;
        const ph = phaseRef.current[i];
        ctx.beginPath(); ctx.arc(cx + Math.cos(ang) * or * ph, cy + Math.sin(ang) * or * ph, 2, 0, Math.PI * 2);
        ctx.fillStyle = accent; ctx.globalAlpha = isDim ? .12 : .65; ctx.fill(); ctx.globalAlpha = 1;

        ctx.beginPath(); ctx.arc(nx, ny, nr, 0, Math.PI * 2);
        ctx.fillStyle = isAct ? `${accent}22` : `${accent}${isDim ? '0a' : '14'}`;
        ctx.fill();
        if (isAct) { ctx.shadowBlur = 18; ctx.shadowColor = accent; }
        ctx.strokeStyle = isAct ? `${accent}cc` : `${accent}${isDim ? '18' : '40'}`;
        ctx.lineWidth = isAct ? 1.8 : .9; ctx.stroke(); ctx.shadowBlur = 0;
      });

      // Center
      ctx.beginPath(); ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 26);
      g.addColorStop(0, `${accent}48`); g.addColorStop(1, `${accent}10`);
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = `${accent}70`; ctx.lineWidth = 1.3; ctx.stroke();

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, [paused, activeIdx]);

  const hitTest = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const cv = cvRef.current; if (!cv) return -1;
    const rect = cv.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (cv.width / rect.width);
    const my = (e.clientY - rect.top) * (cv.height / rect.height);
    const cx = cv.width / 2, cy = cv.height / 2, or = getOrbitR(), nr = getNodeR();
    for (let i = 0; i < ROLES.length; i++) {
      const ang = i * (2 * Math.PI / ROLES.length) + rotation;
      const nx = cx + Math.cos(ang) * or, ny = cy + Math.sin(ang) * or;
      if (Math.hypot(mx - nx, my - ny) < nr + 8) return i;
    }
    return -1;
  }, [rotation]);

  const wrapSize = typeof window !== 'undefined' && window.innerWidth <= 600 ? 320 : 440;

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={wrapRef} className="relative"
        style={{ width: Math.min(wrapSize, 480), height: Math.min(wrapSize, 480), maxWidth: '100%' }}
        onMouseLeave={() => { setActiveIdx(null); setPaused(false); }}
      >
        <canvas
          ref={cvRef}
          style={{ width: '100%', height: '100%' }}
          aria-hidden="true"
          onMouseMove={e => {
            const i = hitTest(e);
            setActiveIdx(i >= 0 ? i : null);
            setPaused(i >= 0);
            (e.currentTarget as HTMLCanvasElement).style.cursor = i >= 0 ? 'pointer' : 'default';
          }}
          onClick={e => { const i = hitTest(e); if (i >= 0) onRoleClick(ROLES[i].key); }}
        />
        {/* Center label */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true">
          <p className="text-xs font-extrabold tracking-widest jih-accent-text">JIH</p>
        </div>
        {/* Node HTML labels */}
        {ROLES.map((r, i) => {
          const wrap = wrapRef.current;
          const W = wrap?.offsetWidth ?? 440, H = wrap?.offsetHeight ?? 440;
          const or = getOrbitR();
          const ang = i * (2 * Math.PI / ROLES.length) + rotation;
          const nx = W / 2 + Math.cos(ang) * or, ny = H / 2 + Math.sin(ang) * or;
          const isAct = activeIdx === i, isDim = activeIdx !== null && !isAct;
          const Icon = r.icon;
          return (
            <button
              key={r.key}
              onClick={() => onRoleClick(r.key)}
              onMouseEnter={() => { setActiveIdx(i); setPaused(true); }}
              aria-label={`Open ${r.label} portal`}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ left: nx, top: ny, opacity: isDim ? .3 : 1, zIndex: 2, transition: 'opacity .18s' }}
            >
              <div className="flex items-center justify-center rounded-xl transition-all duration-200"
                style={{
                  width: window.innerWidth <= 600 ? 34 : 44, height: window.innerWidth <= 600 ? 34 : 44,
                  background: isAct ? r.accent : 'var(--bg-surface)',
                  border: `1.5px solid ${isAct ? r.color : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  boxShadow: isAct ? `0 0 18px ${r.color}40` : 'none',
                }}>
                <Icon size={window.innerWidth <= 600 ? 14 : 18} style={{ color: isAct ? r.color : 'var(--text-2)' }} />
              </div>
              <span className="text-xs font-semibold hidden sm:block whitespace-nowrap"
                style={{ color: isAct ? r.color : 'var(--text-2)', fontSize: '.6rem' }}>{r.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active node desc */}
      <div className="h-10 text-center">
        <AnimatePresence mode="wait">
          {activeIdx !== null && (
            <motion.div key={activeIdx}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: .18 }}>
              <p className="text-sm font-semibold" style={{ color: ROLES[activeIdx].color }}>{ROLES[activeIdx].label}</p>
              <p className="text-xs hidden sm:block" style={{ color: 'var(--text-2)' }}>{ROLES[activeIdx].desc}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// â”€â”€â”€ Main Landing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function Landing() {
  const navigate = useNavigate();

  const [theme, setThemeState] = useState<Theme>(getStoredTheme);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [modal, setModal] = useState<ModalPayload | null>(null);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  /** Role that was clicked in the Ecosystem orbit — null means the auth modal is closed */
  const [authModalRole, setAuthModalRole] = useState<EcoRoleKey | null>(null);

  useEffect(() => { injectCSS(); }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Restore on mount
  useEffect(() => {
    const t = getStoredTheme();
    setThemeState(t);
    applyTheme(t);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 55);
      setShowTop(y > 380);
      const ids = ['hero', 'ecosystem', 'how-it-works', 'impact', 'categories'];
      for (const id of [...ids].reverse()) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 110) { setActiveSection(id); break; }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = modal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modal]);

  const openLogin = useCallback((role: RoleKey) => {
    const targetKey: EcoRoleKey = role === 'company' ? 'industry' : (role as EcoRoleKey);
    setAuthModalRole(targetKey);
    setMenuOpen(false);
  }, []);
  const openStat = useCallback((statId: string) => { setModal({ type: 'stat', statId }); }, []);
  const closeModal = useCallback(() => setModal(null), []);

  const openAuthModal = useCallback((key: EcoRoleKey) => {
    const targetKey = key === 'company' ? 'industry' : key;
    setAuthModalRole(targetKey);
    setMenuOpen(false);
  }, []);




  const changeTheme = useCallback((t: Theme) => { setThemeState(t); applyTheme(t); }, []);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMenuOpen(false);
  }, []);

  const navLinks = [
    { id: 'hero',         label: 'Home' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'ecosystem',    label: 'Ecosystem' },
    { id: 'categories',   label: 'Problems' },
    { id: 'impact',       label: 'Impact' },
  ];

  // Hub SVG
  const HubSVG = () => (
    <svg width="28" height="28" viewBox="0 0 30 30" fill="none" aria-hidden="true">
      <circle cx="15" cy="15" r="13.5" stroke="var(--accent-1)" strokeWidth="1.4" strokeOpacity=".5" />
      <circle cx="15" cy="15" r="3" fill="var(--accent-1)" />
      {[0,72,144,216,288].map((deg, i) => {
        const r = (deg-90)*Math.PI/180, x2=15+Math.cos(r)*10, y2=15+Math.sin(r)*10;
        return <g key={i}><line x1="15" y1="15" x2={x2} y2={y2} stroke="var(--accent-1)" strokeWidth="1" strokeOpacity=".55"/><circle cx={x2} cy={y2} r="2" fill="var(--accent-1)" fillOpacity=".75"/></g>;
      })}
    </svg>
  );

  return (
    <div className="jih-bg" style={{ minHeight: '100vh', fontFamily: 'Inter,system-ui,sans-serif' }}>

      {/* â”€â”€ NAVBAR â”€â”€ */}
      <header role="banner" className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
        style={{
          background: scrolled ? 'var(--bg-surface2)' : 'transparent',
          backdropFilter: scrolled ? 'blur(var(--blur))' : 'none',
          borderBottom: `1px solid ${scrolled ? 'var(--border)' : 'transparent'}`,
        }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <button onClick={() => scrollTo('hero')}
            className="flex items-center gap-2.5 shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:rounded-lg"
            aria-label="Jharkhand Innovation Hub â€” Home">
            <HubSVG />
            <span className="font-semibold text-sm leading-tight hidden sm:block" style={{ color: 'var(--text-1)' }}>
              Jharkhand<br /><span className="jih-accent-text font-bold">Innovation Hub</span>
            </span>
            <span className="font-bold text-sm sm:hidden jih-accent-text">JIH</span>
          </button>

          <nav className="hidden md:flex items-center gap-0.5" aria-label="Main navigation">
            {navLinks.map(l => (
              <button key={l.id} onClick={() => scrollTo(l.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  color: activeSection === l.id ? 'var(--accent-1)' : 'var(--text-2)',
                  background: activeSection === l.id ? 'var(--accent-glow)' : 'transparent',
                }}>
                {l.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex"><ThemeSwitcher current={theme} onChange={changeTheme} /></div>
            <button onClick={() => openLogin('citizen')}
              className="jih-btn-pri hidden sm:flex items-center gap-1.5 px-4 py-1.5 text-xs"
              aria-label="Select Portal">
              Select Portal <ArrowRight size={12} />
            </button>
            <button onClick={() => setMenuOpen(o => !o)}
              className="md:hidden p-2 rounded-xl transition-colors"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-1)', borderRadius: 'var(--radius)' }}
              aria-expanded={menuOpen} aria-label="Toggle menu">
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden"
              style={{ background: 'var(--bg-surface2)', borderTop: '1px solid var(--border)' }}>
              <div className="px-4 py-4 space-y-1">
                {navLinks.map(l => (
                  <button key={l.id} onClick={() => scrollTo(l.id)}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium"
                    style={{ color: 'var(--text-1)', borderRadius: 'var(--radius)' }}>
                    {l.label}
                  </button>
                ))}
                <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                  <ThemeSwitcher current={theme} onChange={changeTheme} />
                  <button onClick={() => openLogin('citizen')} className="jih-btn-pri px-4 py-2 text-sm">
                    Select Portal
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* â”€â”€ HERO â”€â”€ */}
      <section id="hero" className="relative overflow-hidden flex items-center"
        style={{ minHeight: '100svh', paddingTop: '3.5rem' }}>
        <ParticlesCanvas />
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 38%,var(--accent-glow),transparent 72%)' }} />
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none opacity-25"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")` }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center w-full">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, delay: .1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 tracking-wide"
            style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent-1)', color: 'var(--accent-1)', borderRadius: '999px' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent-1)' }} aria-hidden="true" />
            âœ¦ JHARKHAND'S INNOVATION ECOSYSTEM
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .65, delay: .2, ease: [0,0,.2,1] }}
            className="font-extrabold leading-tight mb-5"
            style={{ fontSize: 'clamp(2.1rem,5.5vw,4rem)', color: 'var(--text-1)', maxWidth: 780, margin: '0 auto 1.2rem' }}>
            Transforming Community<br />
            Problems into{' '}
            <span className="jih-accent-text">Real&#8209;World Solutions</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .6, delay: .35 }}
            className="text-base sm:text-lg mb-8 max-w-2xl mx-auto"
            style={{ color: 'var(--text-2)', lineHeight: 1.7 }}>
            A digital platform connecting citizens, universities, industry, and government
            across Jharkhand to crowdsource and solve societal challenges through research,
            innovation, and collaboration.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .5, delay: .5 }}
            className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <button onClick={() => scrollTo('ecosystem')}
              className="jih-btn-pri flex items-center gap-2 px-6 py-3 text-sm font-semibold">
              Explore the Ecosystem <ArrowRight size={15} />
            </button>
            <button onClick={() => openLogin('citizen')}
              className="jih-btn-ghost flex items-center gap-2 px-6 py-3 text-sm font-semibold">
              Enter as Citizen
            </button>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: .5, delay: .65 }}
            className="flex flex-wrap items-center justify-center gap-4 text-xs mb-14"
            style={{ color: 'var(--text-m)' }}>
            {['Government Connected','Student Powered','Community Driven'].map(b => (
              <span key={b} className="flex items-center gap-1.5">
                <CheckCircle2 size={12} style={{ color: 'var(--accent-1)' }} />{b}
              </span>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: .6, delay: .85 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-xl mx-auto">
            {IMPACT_STATS.map(s => (
              <button key={s.id} onClick={() => openStat(s.id)} className="text-center hover:opacity-80 transition-opacity">
                <p className="text-xl sm:text-2xl font-extrabold jih-accent-text">
                  <AnimatedCounter value={s.value} suffix={s.suffix} />
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-m)' }}>{s.label}</p>
              </button>
            ))}
          </motion.div>
        </div>

        <motion.div className="absolute bottom-7 left-1/2 -translate-x-1/2 cursor-pointer"
          animate={{ y: [0,8,0] }} transition={{ duration: 2, repeat: Infinity }}
          onClick={() => scrollTo('ecosystem')} role="button" tabIndex={0}
          aria-label="Scroll down" onKeyDown={e => e.key === 'Enter' && scrollTo('ecosystem')}>
          <div className="w-5 h-8 flex items-start justify-center p-1 rounded-full"
            style={{ border: '1.5px solid var(--border)' }}>
            <div className="w-1 h-2 rounded-full" style={{ background: 'var(--text-m)' }} />
          </div>
        </motion.div>
      </section>

      {/* â”€â”€ ECOSYSTEM â”€â”€ */}
      <section id="ecosystem" className="py-20 px-4 sm:px-6" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-5xl mx-auto">
          <SR className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--accent-1)' }}>Ecosystem</p>
            <h2 className="font-extrabold mb-3" style={{ fontSize: 'clamp(1.7rem,4vw,2.4rem)', color: 'var(--text-1)' }}>
              One Platform. Five Stakeholders.<br /><span className="jih-accent-text">One Mission.</span>
            </h2>
            <p className="max-w-lg mx-auto" style={{ color: 'var(--text-2)', lineHeight: 1.7 }}>
              Every actor in the innovation pipeline working together to turn community problems into real-world solutions.
            </p>
          </SR>
          <SR delay={.12}>
            <EcosystemOrbit onRoleClick={openAuthModal} />
          </SR>
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {ROLES.map((r, i) => {
              const Icon = r.icon;
              return (
                <SR key={r.key} delay={.05 * i}>
                  <button onClick={() => openAuthModal(r.key)}
                    className="jih-card w-full p-3 flex flex-col items-center gap-2 text-center"
                    aria-label={`Open ${r.label} portal`}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: r.accent, borderRadius: 'var(--radius)' }}>
                      <Icon size={16} style={{ color: r.color }} />
                    </div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-1)' }}>{r.label}</p>
                  </button>
                </SR>
              );
            })}
          </div>
        </div>
      </section>

      {/* â”€â”€ HOW IT WORKS â”€â”€ */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6"
        style={{ background: 'var(--bg-surface)', backdropFilter: 'blur(var(--blur))' }}>
        <div className="max-w-4xl mx-auto">
          <SR className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--accent-1)' }}>Process</p>
            <h2 className="font-extrabold mb-2" style={{ fontSize: 'clamp(1.7rem,4vw,2.4rem)', color: 'var(--text-1)' }}>
              From Problem to Impact
            </h2>
            <p style={{ color: 'var(--text-2)' }}>An 8-stage pipeline from citizen problem to government-validated solution</p>
          </SR>

          <div className="relative">
            <div className="hidden sm:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2"
              style={{ background: 'var(--border)' }} aria-hidden="true" />
            {STEPS.map((s, i) => {
              const Icon = s.icon, isLeft = i % 2 === 0;
              return (
                <SR key={s.step} delay={i * .06}>
                  <div className={cn('relative flex items-center gap-0 mb-8', 'sm:gap-6',
                    isLeft ? 'sm:flex-row' : 'sm:flex-row-reverse')}>
                    <div className={cn('flex-1', isLeft ? 'sm:text-right' : '')}>
                      <div className="jih-card p-4 inline-block w-full sm:max-w-xs"
                        style={{ marginLeft: isLeft ? 'auto' : 0 }}>
                        <div className={cn('flex items-center gap-2 mb-2', isLeft ? 'sm:flex-row-reverse' : '')}>
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent-1)', borderRadius: 'var(--radius)' }}>
                            <Icon size={13} style={{ color: 'var(--accent-1)' }} />
                          </div>
                          <div className={isLeft ? 'sm:text-right' : ''}>
                            <span className="text-xs font-bold" style={{ color: 'var(--accent-1)' }}>Step {s.step}</span>
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{s.label}</p>
                          </div>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>{s.desc}</p>
                      </div>
                    </div>
                    <div className="hidden sm:flex shrink-0 w-8 h-8 rounded-full items-center justify-center font-bold text-xs z-10"
                      style={{ background: 'var(--accent-1)', color: '#fff',
                        boxShadow: `0 0 0 4px var(--bg-primary),0 0 12px var(--accent-glow)` }}
                      aria-hidden="true">{s.step}</div>
                    <div className="flex-1 hidden sm:block" />
                  </div>
                </SR>
              );
            })}
          </div>
        </div>
      </section>

      {/* â”€â”€ IMPACT â”€â”€ */}
      <section id="impact" className="py-20 px-4 sm:px-6" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-5xl mx-auto">
          <SR className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--accent-1)' }}>Impact</p>
            <h2 className="font-extrabold mb-1" style={{ fontSize: 'clamp(1.7rem,4vw,2.4rem)', color: 'var(--text-1)' }}>Platform Impact</h2>
            <p className="text-xs" style={{ color: 'var(--text-m)' }}>âš  Demo data â€” for prototype demonstration purposes only</p>
          </SR>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {IMPACT_STATS.map((s, i) => (
              <SR key={s.id} delay={i * .08}>
                <button onClick={() => openStat(s.id)}
                  className="jih-card w-full text-left p-6 group"
                  aria-label={`View ${s.label} breakdown`}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-bold tracking-widest" style={{ color: 'var(--text-m)' }}>{s.num}</span>
                    <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all"
                      style={{ color: 'var(--accent-1)' }} />
                  </div>
                  <p className="text-3xl font-extrabold mb-0.5 jih-accent-text">
                    <AnimatedCounter value={s.value} suffix={s.suffix} />
                  </p>
                  <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-1)' }}>{s.label}</p>
                  <div className="space-y-1.5">
                    {s.breakdown.slice(0,3).map(b => (
                      <div key={b.cat} className="flex items-center gap-2">
                        <span className="text-xs w-28 truncate shrink-0" style={{ color: 'var(--text-m)' }}>{b.cat}</span>
                        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                          <div className="h-full rounded-full" style={{ width: `${b.pct}%`, background: 'var(--accent-1)', opacity: .7 }} />
                        </div>
                        <span className="text-xs w-7 text-right shrink-0" style={{ color: 'var(--text-m)' }}>{b.pct}%</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs mt-3" style={{ color: 'var(--text-m)' }}>Click for full breakdown â†’</p>
                </button>
              </SR>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ CATEGORIES â”€â”€ */}
      <section id="categories" className="py-20 px-4 sm:px-6"
        style={{ background: 'var(--bg-surface)', backdropFilter: 'blur(var(--blur))' }}>
        <div className="max-w-6xl mx-auto">
          <SR className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--accent-1)' }}>Focus Areas</p>
            <h2 className="font-extrabold mb-2" style={{ fontSize: 'clamp(1.7rem,4vw,2.4rem)', color: 'var(--text-1)' }}>
              11 Problem Domains
            </h2>
            <p style={{ color: 'var(--text-2)' }}>Covering every critical challenge facing Jharkhand's communities</p>
            {activeCat && (
              <p className="text-xs mt-2 font-semibold" style={{ color: 'var(--accent-1)' }}>
                Showing: {activeCat} â€”{' '}
                <button onClick={() => setActiveCat(null)} className="underline">Clear</button>
              </p>
            )}
          </SR>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {DOMAINS.map((d, i) => {
              const isAct = activeCat === d.label, isDim = activeCat !== null && !isAct;
              return (
                <SR key={d.label} delay={i * .04}>
                  <button
                    onClick={() => {
                      setActiveCat(prev => prev === d.label ? null : d.label);
                    }}
                    className="jih-card w-full p-4 text-center flex flex-col items-center gap-2"
                    style={{
                      opacity: isDim ? .38 : 1,
                      border: `${isAct ? '1.5px' : '1px'} solid ${isAct ? 'var(--accent-1)' : 'var(--border)'}`,
                      boxShadow: isAct ? '0 0 18px var(--accent-glow)' : 'none',
                    }}
                    aria-pressed={isAct}
                    aria-label={`${d.label} â€” ${d.count} challenges`}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                      style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius)' }}>
                      {d.emoji}
                    </div>
                    <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--text-1)' }}>{d.label}</p>
                    <p className="text-xs" style={{ color: 'var(--text-m)' }}>{d.count} challenges</p>
                  </button>
                </SR>
              );
            })}
          </div>

          <AnimatePresence>
            {activeCat && (
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: .22 }}
                className="mt-8 jih-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-base" style={{ color: 'var(--text-1)' }}>{activeCat}</h3>
                    <p className="text-sm" style={{ color: 'var(--text-2)' }}>
                      {DOMAINS.find(d => d.label === activeCat)?.count} active challenges
                      â€” click "Enter as Citizen" to submit a new one
                    </p>
                  </div>
                  <button onClick={() => setActiveCat(null)}
                    className="p-2 rounded-xl" style={{ background: 'var(--bg-surface)', color: 'var(--text-m)', borderRadius: 'var(--radius)' }}
                    aria-label="Clear filter"><X size={14} /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['View all problems','Submit a problem','Browse solutions','Join a team'].map(a => (
                    <button key={a} onClick={() => openLogin('citizen')}
                      className="jih-btn-ghost text-xs px-3 py-1.5">{a} â†’</button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* â”€â”€ CTA â”€â”€ */}
      <section className="py-20 px-4 sm:px-6" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <SR>
            <div className="p-8 sm:p-12 relative overflow-hidden"
              style={{ background: 'var(--accent-glow)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
              <div aria-hidden="true" className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 80% 55% at 50% 0%,var(--accent-glow),transparent 72%)' }} />
              <div className="relative">
                <h2 className="font-extrabold mb-3" style={{ fontSize: 'clamp(1.5rem,4vw,2.1rem)', color: 'var(--text-1)' }}>
                  Ready to explore the platform?
                </h2>
                <p className="mb-8" style={{ color: 'var(--text-2)' }}>
                   Sign in or create an account to explore the platform across all stakeholder roles.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <button onClick={() => openLogin('citizen')}
                    className="jih-btn-pri px-6 py-3 text-sm font-semibold flex items-center gap-2">
                    Get Started <ArrowRight size={15} />
                  </button>
                  </div>
              </div>
            </div>
          </SR>
        </div>
      </section>

      {/* â”€â”€ FOOTER â”€â”€ */}
      <footer role="contentinfo" className="px-4 sm:px-6 pt-12 pb-6"
        style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <svg width="22" height="22" viewBox="0 0 30 30" fill="none" aria-hidden="true">
                  <circle cx="15" cy="15" r="13.5" stroke="var(--accent-1)" strokeWidth="1.4" strokeOpacity=".5" />
                  <circle cx="15" cy="15" r="3" fill="var(--accent-1)" />
                  {[0,72,144,216,288].map((deg,i) => {
                    const r=(deg-90)*Math.PI/180,x2=15+Math.cos(r)*10,y2=15+Math.sin(r)*10;
                    return <g key={i}><line x1="15" y1="15" x2={x2} y2={y2} stroke="var(--accent-1)" strokeWidth="1" strokeOpacity=".4"/><circle cx={x2} cy={y2} r="2" fill="var(--accent-1)" fillOpacity=".7"/></g>;
                  })}
                </svg>
                <span className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>Jharkhand Innovation Hub</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
                Connecting communities, institutions, and government to solve real challenges across Jharkhand. SIH 2026 Â· PS-43.
              </p>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-m)' }}>Platform</h3>
              <ul className="space-y-2">
                {navLinks.map(l => (
                  <li key={l.id}><button onClick={() => scrollTo(l.id)} className="text-xs hover:underline" style={{ color: 'var(--text-2)', cursor: 'pointer' }}>{l.label}</button></li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-m)' }}>Portals</h3>
              <ul className="space-y-2">
                {ROLES.map(r => (
                  <li key={r.key}><button onClick={() => openLogin(r.key)} className="text-xs hover:underline" style={{ color: 'var(--text-2)', cursor: 'pointer' }}>{r.label}</button></li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-m)' }}>Legal</h3>
              <ul className="space-y-2">
                {['Privacy Policy','Terms of Use','Accessibility','Contact Us'].map(l => (
                  <li key={l}><button className="text-xs hover:underline" style={{ color: 'var(--text-2)', cursor: 'pointer' }}>{l}</button></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 text-xs"
            style={{ borderTop: '1px solid var(--border)', color: 'var(--text-m)' }}>
            <p>Â© 2026 Jharkhand Innovation Hub Â· Government of Jharkhand Â· SIH 2026 Â· PS-43</p>
            <div className="flex items-center gap-3">
              <span>Theme:</span>
              <ThemeSwitcher current={theme} onChange={changeTheme} />
            </div>
          </div>
        </div>
      </footer>

      {/* â”€â”€ SCROLL TO TOP â”€â”€ */}
      <AnimatePresence>
        {showTop && (
          <motion.button initial={{ opacity: 0, scale: .8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 z-30 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'var(--accent-1)', color: '#fff', boxShadow: '0 4px 16px var(--accent-glow)' }}
            aria-label="Scroll to top">
            <ChevronUp size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* â”€â”€ MODAL â”€â”€ */}
      <AnimatePresence>
        {modal && (
          <JIHModal key={modal.statId}
            payload={modal} onClose={closeModal} />
        )}
      </AnimatePresence>
      {/* ── ROLE AUTH MODAL (Ecosystem node clicks) ── */}
      <AnimatePresence>
        {authModalRole && (
          <RoleAuthModal
            key={authModalRole}
            initialRole={authModalRole}
            onClose={() => setAuthModalRole(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
