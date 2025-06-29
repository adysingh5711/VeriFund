import * as React from "react";
import { cn } from "@/utils/cn";

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
    min?: number;
    max?: number;
    step?: number;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(({ className, ...props }, ref) => (
    <input ref={ref} type="range" className={cn("w-full h-2 bg-gray-200 rounded appearance-none", className)} {...props} />
));
Slider.displayName = "Slider";

export { Slider }; 