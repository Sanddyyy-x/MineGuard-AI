import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Pickaxe,
  ShieldCheck,
  ClipboardCheck,
  Eye,
  AlertTriangle,
  Wrench,
  Bell,
  Map,
  Brain,
  FileBarChart,
  Settings,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badgeKey?: 'activeAlerts' | 'openViolations' | 'pendingInspections';
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Mines', href: '/mines', icon: Pickaxe },
  { label: 'Compliance', href: '/compliance', icon: ShieldCheck },
  { label: 'Inspections', href: '/inspections', icon: ClipboardCheck, badgeKey: 'pendingInspections' },
  { label: 'Observations', href: '/observations', icon: Eye },
  { label: 'Violations', href: '/violations', icon: AlertTriangle, badgeKey: 'openViolations' },
  { label: 'Corrective Actions', href: '/corrective-actions', icon: Wrench },
  { label: 'Alerts', href: '/alerts', icon: Bell, badgeKey: 'activeAlerts' },
  { label: 'GIS / Mine Map', href: '/gis', icon: Map },
  { label: 'AI Risk Analysis', href: '/ai-risk', icon: Brain },
  { label: 'Reports', href: '/reports', icon: FileBarChart },
  { label: 'Settings', href: '/settings', icon: Settings },
];
