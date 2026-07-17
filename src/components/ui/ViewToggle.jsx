import { LayoutGrid, List } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function ViewToggle({ view, onChange }) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-lg border border-border shrink-0">
      <button
        type="button"
        onClick={() => onChange('grid')}
        aria-label="Grid view"
        aria-pressed={view === 'grid'}
        className={cn(
          'w-8 h-8 flex items-center justify-center rounded-md transition-colors',
          view === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-card'
        )}
      >
        <LayoutGrid size={16} />
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        aria-label="List view"
        aria-pressed={view === 'list'}
        className={cn(
          'w-8 h-8 flex items-center justify-center rounded-md transition-colors',
          view === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-card'
        )}
      >
        <List size={16} />
      </button>
    </div>
  );
}
