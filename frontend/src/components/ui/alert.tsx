import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, Info } from "lucide-react";

const iconMap = {
  default: Info,
  destructive: AlertTriangle,
};

type AlertVariant = keyof typeof iconMap;

type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant;
  title?: string;
};

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", title, children, ...props }, ref) => {
    const Icon = iconMap[variant];
    return (
      <div
        ref={ref}
        className={cn(
          "flex w-full gap-3 rounded-lg border px-3 py-2 text-sm shadow-sm",
          variant === "destructive" && "border-destructive/40 bg-destructive/5 text-destructive",
          variant === "default" && "border-border/60 bg-muted/40 text-foreground",
          className
        )}
        role="alert"
        {...props}
      >
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="flex flex-col">
          {title ? <p className="font-semibold leading-snug">{title}</p> : null}
          <p className="text-sm leading-snug text-muted-foreground">{children}</p>
        </div>
      </div>
    );
  }
);
Alert.displayName = "Alert";

export { Alert };
