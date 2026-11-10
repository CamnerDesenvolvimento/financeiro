import { clsx } from 'clsx';
import { X, Loader2 } from 'lucide-react';
import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md'; loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
        size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2 text-sm',
        {
          primary: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700',
          secondary: 'border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50',
          danger: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700',
          ghost: 'text-slate-600 hover:bg-slate-100',
        }[variant],
        className,
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Card({ title, actions, children, className }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={clsx('card', className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <div className="flex items-center gap-2">{actions}</div>
        </div>
      )}
      {children}
    </div>
  );
}

export function Stat({ label, value, hint, tone = 'default', icon }: { label: string; value: ReactNode; hint?: ReactNode; tone?: 'default' | 'green' | 'red' | 'amber' | 'blue'; icon?: ReactNode }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <p
        className={clsx('mt-1.5 text-2xl font-semibold tabular-nums', {
          'text-slate-900': tone === 'default',
          'text-emerald-600': tone === 'green',
          'text-rose-600': tone === 'red',
          'text-amber-600': tone === 'amber',
          'text-sky-600': tone === 'blue',
        })}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

const BADGE: Record<string, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  red: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  blue: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  gray: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/20',
};

export function Badge({ tone = 'gray', children }: { tone?: keyof typeof BADGE | string; children: ReactNode }) {
  return <span className={clsx('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset', BADGE[tone] ?? BADGE.gray)}>{children}</span>;
}

export const SITUACAO_TONE = { pendente: 'blue', atrasado: 'red', pago: 'green', cancelado: 'gray' } as const;
export const PROJETO_TONE = { proposta: 'violet', em_andamento: 'blue', pausado: 'amber', concluido: 'green', cancelado: 'gray' } as const;

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 pt-[8vh]" onMouseDown={onClose}>
      <div className={clsx('card w-full shadow-xl', wide ? 'max-w-3xl' : 'max-w-lg')} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={clsx('block', className)}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-5 py-10 text-center text-sm text-slate-500">{children}</div>;
}

export function Loading() {
  return (
    <div className="flex justify-center py-16 text-slate-400">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100">{children}</table>
    </div>
  );
}
