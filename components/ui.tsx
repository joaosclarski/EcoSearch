import { AlertTriangle, Cog, FlaskConical, Recycle, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Categoria, StatusLote, StatusPedido } from '@/lib/data';

export const CATEGORIA_ESTILO: Record<Categoria, { icon: LucideIcon; badge: string; tile: string }> = {
  Plástico: { icon: Recycle, badge: 'bg-sky-50 text-sky-700 ring-sky-200', tile: 'bg-sky-50 text-sky-600' },
  Químico: { icon: FlaskConical, badge: 'bg-amber-50 text-amber-800 ring-amber-200', tile: 'bg-amber-50 text-amber-600' },
  Metal: { icon: Cog, badge: 'bg-slate-100 text-slate-700 ring-slate-300', tile: 'bg-slate-100 text-slate-600' },
};

export function CategoriaBadge({ categoria }: { categoria: Categoria }) {
  const { icon: Icon, badge } = CATEGORIA_ESTILO[categoria];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${badge}`}>
      <Icon className="h-3.5 w-3.5" />
      {categoria}
    </span>
  );
}

export function PerigosoBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200">
      <AlertTriangle className="h-3.5 w-3.5" />
      Classe I · Perigoso
    </span>
  );
}

const STATUS_ESTILO: Record<StatusLote | StatusPedido, string> = {
  Disponível: 'bg-eco-50 text-eco-700 ring-eco-200',
  Reservado: 'bg-amber-50 text-amber-800 ring-amber-200',
  Vendido: 'bg-slate-100 text-slate-600 ring-slate-300',
  'Aguardando Pagamento': 'bg-amber-50 text-amber-800 ring-amber-200',
  'Pagamento Retido no Escrow': 'bg-navy-50 text-navy-700 ring-navy-200',
  Concluído: 'bg-eco-50 text-eco-700 ring-eco-200',
};

export function StatusBadge({ status }: { status: StatusLote | StatusPedido }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_ESTILO[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-wider text-eco-600">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-navy-700 sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-slate-500">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'navy',
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: 'navy' | 'eco';
}) {
  return (
    <div className="card flex items-start gap-4 p-5">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          tone === 'eco' ? 'bg-eco-50 text-eco-600' : 'bg-navy-50 text-navy-600'
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-1 truncate text-xl font-bold tabular-nums text-navy-700">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
      </div>
    </div>
  );
}
