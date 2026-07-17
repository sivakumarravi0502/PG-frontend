import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export default function Modal({ open, onOpenChange, title, description, children, maxWidth = 'max-w-md' }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content
          className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] ${maxWidth} card z-50 max-h-[90vh] overflow-y-auto`}
        >
          <div className="card-header">
            <div>
              <Dialog.Title className="card-title">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="text-xs text-muted-foreground mt-0.5">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button className="action-btn-view" aria-label="Close">
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>
          <div className="card-body">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
