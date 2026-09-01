import { useToast } from "@/components/ui/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast
            key={id}
            {...props}
            className="!border-amber-400/35"
            style={{
              background: 'rgba(20,16,8,0.55)',
              backdropFilter: 'blur(18px) saturate(160%)',
              WebkitBackdropFilter: 'blur(18px) saturate(160%)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.55), 0 0 18px rgba(212,175,55,0.2), inset 0 1px 0 rgba(255,255,255,0.18)',
            }}
          >
            <div className="grid gap-1">
              {title && (
                <ToastTitle
                  className="!text-amber-300"
                  style={{ fontFamily: "'Rye', Georgia, serif", textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                >
                  {title}
                </ToastTitle>
              )}
              {description && (
                <ToastDescription
                  className="!text-amber-100/90"
                  style={{ fontFamily: "'Rye', Georgia, serif" }}
                >
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className="!text-amber-300/60 hover:!text-amber-200" />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}