import * as React from "react";
import { cn } from "@/utils/cn";

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> { }

const Tabs: React.FC<TabsProps> = ({ className, ...props }) => (
    <div className={cn("flex flex-col", className)} {...props} />
);

const TabsList: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
    <div className={cn("flex border-b", className)} {...props} />
);

const TabsTrigger: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...props }) => (
    <button className={cn("px-4 py-2 text-sm font-medium", className)} {...props} />
);

const TabsContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
    <div className={cn("p-4", className)} {...props} />
);

export { Tabs, TabsList, TabsTrigger, TabsContent }; 