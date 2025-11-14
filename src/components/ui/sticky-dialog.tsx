import * as React from "react";
import { DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface StickyDialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogContent> {
  children?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function StickyDialogContent({
  children,
  header,
  footer,
  maxWidth = "md",
  className,
  ...props
}: StickyDialogContentProps) {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  return (
    <DialogContent
      className={cn(
        maxWidthClasses[maxWidth],
        "max-h-[85dvh] overflow-y-auto p-0",
        className
      )}
      {...props}
    >
      {header && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-6 pt-6 pb-3">
          {header}
        </div>
      )}

      <div className="px-6 py-4 space-y-4 pb-24">
        {children}
      </div>

      {footer && (
        <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t px-6 py-3">
          {footer}
        </div>
      )}
    </DialogContent>
  );
}

export { DialogHeader, DialogFooter };
