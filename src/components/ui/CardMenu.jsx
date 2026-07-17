import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function CardMenu({ items }) {
  const visible = items.filter(Boolean);
  if (visible.length === 0) return null;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
          aria-label="Actions"
        >
          <MoreVertical size={16} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className="min-w-[160px] bg-card border border-border rounded-lg shadow-lg py-1 z-50"
          onClick={(e) => e.stopPropagation()}
        >
          {visible.map((item, i) => (
            <DropdownMenu.Item
              key={i}
              onSelect={item.onClick}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm cursor-pointer outline-none transition-colors',
                item.danger ? 'text-destructive hover:bg-destructive/10' : 'text-foreground hover:bg-muted'
              )}
            >
              {item.icon}
              {item.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
