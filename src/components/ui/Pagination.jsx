import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

function pageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push('...');
    out.push(sorted[i]);
  }
  return out;
}

export default function Pagination({ page, totalPages, total, limit, onPageChange, itemLabel = 'items' }) {
  if (totalPages <= 1) return null;

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-border flex-wrap gap-3">
      <p className="text-xs text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{start}</span> to{' '}
        <span className="font-semibold text-foreground">{end}</span> of{' '}
        <span className="font-semibold text-foreground">{total}</span> {itemLabel}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={15} />
        </button>
        {pageList(page, totalPages).map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-sm text-muted-foreground">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={cn(
                'w-8 h-8 flex items-center justify-center rounded-md text-sm font-semibold transition-colors',
                p === page ? 'bg-primary text-primary-foreground' : 'border border-border text-foreground hover:bg-muted'
              )}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
