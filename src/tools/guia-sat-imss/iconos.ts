/**
 * ARK LEDGER — Guía SAT/IMSS
 * Mapeo de nombres de iconos string → componentes Lucide.
 */

import type { LucideIcon } from 'lucide-react';
import {
  Mail,
  FileSearch,
  Layers,
  ClipboardCheck,
  Target,
  Send,
  Eye,
  Gavel,
  Building2,
  FileText,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  mail: Mail,
  'file-search': FileSearch,
  layers: Layers,
  'clipboard-check': ClipboardCheck,
  target: Target,
  send: Send,
  eye: Eye,
  gavel: Gavel,
  building: Building2,
  'file-text': FileText,
};

export function getIconoGuia(icono: string): LucideIcon {
  return ICON_MAP[icono] ?? FileText;
}
