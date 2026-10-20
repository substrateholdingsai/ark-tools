/**
 * ARK TOOLS — Componentes Compuestos
 *
 * Punto de entrada para componentes de layout y composición.
 * Uso: import { Header, ToolCard } from '@/components';
 */

// Atómicos (re-export)
export * from './ui';

// Compuestos
export { Logo } from './Logo';
export { Header } from './Header';
export { Footer } from './Footer';
export { ToolCard } from './ToolCard';
export { CategorySection } from './CategorySection';
export { ToolSkeleton } from './ToolSkeleton';
export { AuthGate } from './AuthGate';
export { LandingPage } from './LandingPage';
export { AiAssistantWidget } from './AiAssistantWidget';
export { ExpedienteSelector } from './ExpedienteSelector';
export { ExpedienteToolBanner } from './ExpedienteToolBanner';
export { PapelDeTrabajoModal } from './PapelDeTrabajoModal';
export { VerificacionPublicaModal } from './VerificacionPublicaModal';
export { AdminPanel } from './admin/AdminPanel';
export { TeamModal, InviteAcceptModal } from './team';
export { ErrorBoundary } from './ErrorBoundary';

// Tipos
export type { NavItem } from './Header';
