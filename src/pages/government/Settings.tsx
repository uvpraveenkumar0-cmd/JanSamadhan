import React from 'react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card, SectionHeader } from '../../components/ui/Card';
import { Settings as SettingsIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';

export default function Settings() {
  const { addToast } = useApp();
  return (
    <PageTransition>
      <SectionHeader title="Settings" subtitle="Platform configuration and preferences" />
      <Card padding="lg" className="max-w-lg">
        <div className="space-y-4">
          {[
            { label: 'Platform Name', value: 'JanSamadhan Innovation Hub' },
            { label: 'State', value: 'Jharkhand' },
            { label: 'AI Analysis', value: 'Enabled (Advisory Only)' },
            { label: 'Auto-notification', value: 'Enabled' },
            { label: 'Audit Logging', value: 'Full' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center py-3 border-b border-surface-100 last:border-0">
              <span className="text-sm text-surface-600">{label}</span>
              <span className="text-sm font-medium text-surface-900">{value}</span>
            </div>
          ))}
          <Button variant="primary" onClick={() => addToast({ type: 'info', title: 'Settings saved', message: 'Real backend: persisted to database.' })}>
            Save Settings
          </Button>
        </div>
      </Card>
    </PageTransition>
  );
}
