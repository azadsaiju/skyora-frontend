"use client";

/**
 * Inline error state shown when /api/public/content cannot be loaded.
 * Never leaves infinite skeletons behind — offers a Retry button.
 */

import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContentErrorProps {
  message: string;
  onRetry: () => void;
}

export function ContentError({ message, onRetry }: ContentErrorProps) {
  return (
    <div role="alert" className="brutal-card p-8 text-center md:p-10">
      <p className="font-grotesk text-sm font-bold uppercase tracking-widest text-brand-red">
        Something went wrong
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm break-words text-muted-foreground">
        {message}
      </p>
      <Button
        onClick={onRetry}
        className="brutal-hover mt-5 rounded-lg font-bold uppercase"
      >
        <RotateCw className="h-4 w-4" aria-hidden />
        Retry
      </Button>
    </div>
  );
}
