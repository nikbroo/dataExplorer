import type { ReactNode } from "react";
import { AlertTriangle, Inbox, RotateCw } from "lucide-react";

interface StatusMessageProps {
  variant: "empty" | "error";
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}

const StatusMessage = ({
  variant,
  title,
  description,
  actionLabel,
  onAction,
  children,
}: StatusMessageProps) => {
  const Icon = variant === "error" ? AlertTriangle : Inbox;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <Icon
        aria-hidden="true"
        className={`size-10 ${variant === "error" ? "text-rose-500" : "text-slate-400"}`}
      />
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {description && <p className="max-w-md text-sm text-slate-600">{description}</p>}
      {children}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-1 inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          {variant === "error" && <RotateCw aria-hidden="true" className="size-4" />}
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default StatusMessage;
