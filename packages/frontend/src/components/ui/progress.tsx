import * as React from "react";
import { cn } from "@/utils/cn";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    value: number;
    max?: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(({ value, max = 100, className, ...props }, ref) => (
    <div ref={ref} className={cn("w-full h-2 bg-gray-200 rounded", className)} {...props}>
        <div className="h-2 bg-primary rounded" style={{ width: `${(value / max) * 100}%` }} />
    </div>
));
Progress.displayName = "Progress";

export { Progress }; 