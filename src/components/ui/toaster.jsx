import { useToast } from "@/components/ui/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { GOLD_GLASS } from "@/lib/glassCard";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast
            key={id}
            {...props}
            style={GOLD_GLASS}
          >
            <div className="grid gap-0.5">
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