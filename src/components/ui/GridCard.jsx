import { cn } from '../../lib/utils';
import CardMenu from './CardMenu';

export default function GridCard({ icon, iconColor = 'bg-primary text-white', title, meta, badge, menuItems, stats = [], progress }) {
  return (
    <div className="card p-4 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold text-base overflow-hidden', iconColor)}>
          {icon}
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-start justify-between gap-2">
            <p className="font-heading font-bold text-[15px] leading-snug line-clamp-2" title={typeof title === 'string' ? title : undefined}>
              {title}
            </p>
            <div className="flex items-center gap-1 shrink-0">
              {badge}
              <CardMenu items={menuItems} />
            </div>
          </div>
          {meta && <p className="text-xs text-muted-foreground mt-1 truncate">{meta}</p>}
        </div>
      </div>

      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-3 pt-3 border-t border-border">
          {stats.map((s, i) => (
            <div key={i} className="flex items-start gap-2 min-w-0">
              <span className="text-muted-foreground shrink-0 mt-0.5">{s.icon}</span>
              <div className="min-w-0">
                <p className="font-bold text-sm text-foreground truncate">{s.value ?? '—'}</p>
                <p className="text-[11px] text-muted-foreground truncate">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {progress && (
        <div className={stats.length > 0 ? '' : 'pt-3 border-t border-border'}>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground font-semibold">{progress.label || 'Progress'}</span>
            <span className="font-bold text-foreground">{Math.round(progress.percent)}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full', progress.colorClass || 'bg-primary')}
              style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
