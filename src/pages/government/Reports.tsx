import React from 'react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card, SectionHeader } from '../../components/ui/Card';
import { FileSearch, Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useApp } from '../../context/AppContext';

const REPORTS = [
  { title: 'Monthly Platform Impact Report — August 2026', type: 'Impact', date: '01 Sep 2026', size: '2.4 MB' },
  { title: 'University Participation Analysis Q3 2026',    type: 'University', date: '28 Aug 2026', size: '1.8 MB' },
  { title: 'District-wise Problem Distribution Report',    type: 'District', date: '15 Aug 2026', size: '3.1 MB' },
  { title: 'Industry Collaboration & Funding Summary',     type: 'Industry', date: '01 Aug 2026', size: '0.9 MB' },
];

export default function Reports() {
  const { addToast } = useApp();
  return (
    <PageTransition>
      <SectionHeader title="Reports" subtitle="Platform analytics and impact reports" />
      <div className="space-y-3 max-w-2xl">
        {REPORTS.map((r, i) => (
          <Card key={i} padding="md" className="flex items-center gap-4">
            <div className="p-2.5 bg-primary-50 rounded-lg shrink-0">
              <FileSearch size={20} className="text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-900 truncate">{r.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="gray" size="sm">{r.type}</Badge>
                <span className="text-xs text-surface-400">{r.date} · {r.size}</span>
              </div>
            </div>
            <Button size="sm" variant="secondary" icon={<Download size={14} />}
              onClick={() => addToast({ type: 'info', title: 'Download simulated', message: 'Real backend: returns PDF/XLSX from server.' })}
            >
              Download
            </Button>
          </Card>
        ))}
      </div>
    </PageTransition>
  );
}
