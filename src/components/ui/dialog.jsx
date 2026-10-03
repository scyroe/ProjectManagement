import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { cn } from 'cn';
import { X } from 'lucide-react';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogTitle = DialogPrimitive.Title;
const DialogDescription = DialogPrimitive.Description;
const DialogClose = DialogPrimitive.Close;

const DialogBackdrop = ({ className, ...props }) => (
  <DialogPrimitive.Backdrop
    className={cn(
      'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-out data-[starting-style]:opacity-0 data-closed:opacity-0',
      className,
    )}
    {...props}
  />
);

const DialogContent = ({ className, children, ...props }) => (
  <DialogPortal>
    <DialogBackdrop />
    <DialogPrimitive.Popup
      className={cn(
        'fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-6 text-card-foreground shadow-xl outline-none transition-all duration-300 ease-out data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-closed:scale-95 data-closed:opacity-0',
        className,
      )}
      {...props}
    >
      {children}
      <DialogClose
        className="absolute top-4 right-4 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label="Close settings"
      >
        <X className="size-4" />
      </DialogClose>
    </DialogPrimitive.Popup>
  </DialogPortal>
);

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
};
