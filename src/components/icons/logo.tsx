
import * as React from "react";
import { cn } from "@/lib/utils";

export const Logo = ({ className, ...props }: { className?: string }) => (
  <div className={cn("flex flex-col items-start", className)} {...props}>
    <h1 className="font-headline font-bold text-4xl text-primary leading-none">Yuktah</h1>
    <p className="text-sm text-muted-foreground mt-1 whitespace-nowrap">Health connected. Care protected.</p>
  </div>
);
