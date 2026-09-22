import React from 'react';
import { useApp } from '../../context/AppContext';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card, SectionHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { User, Mail, Phone, MapPin, Calendar } from 'lucide-react';

export default function CitizenProfile() {
  const { user } = useApp();
  return (
    <PageTransition>
      <SectionHeader title="My Profile" />
      <div className="max-w-lg">
        <Card padding="lg">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-700">
              {user?.name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-surface-900">{user?.name}</h2>
              <Badge variant="success">Citizen</Badge>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-surface-600"><Mail size={16} className="text-surface-400" />{user?.email}</div>
            <div className="flex items-center gap-3 text-surface-600"><MapPin size={16} className="text-surface-400" />Ranchi, Jharkhand</div>
            <div className="flex items-center gap-3 text-surface-600"><Calendar size={16} className="text-surface-400" />Member since August 2026</div>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
