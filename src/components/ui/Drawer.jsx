import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export default function Drawer({ open, onOpenChange, title, description, children, width = 'w-[640px]' }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content
          className={`fixed right-0 top-0 h-full ${width} max-w-full bg-card z-50 flex flex-col shadow-lg`}
        >
          <div className="card-header shrink-0">
            <div>
              <Dialog.Title className="card-title">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="text-xs text-muted-foreground mt-0.5">{description}</Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button className="action-btn-view" aria-label="Close"><X size={16} /></button>
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto card-body">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
