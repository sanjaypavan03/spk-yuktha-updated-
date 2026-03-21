"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, CheckCircle2, Search, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumSelectProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string; icon?: LucideIcon }[];
    icon?: LucideIcon;
    searchable?: boolean;
    className?: string;
}

export function PremiumSelect({
    label,
    value,
    onChange,
    options,
    icon: Icon,
    searchable = false,
    className
}: PremiumSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={cn("space-y-2", className)} ref={containerRef}>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 whitespace-nowrap">
                {label}
            </label>
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "w-full flex items-center justify-between pl-11 pr-4 h-[56px] bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 hover:border-indigo-100 transition-all font-medium group text-sm",
                        isOpen && "ring-4 ring-indigo-500/5 border-indigo-100 shadow-sm"
                    )}
                >
                    <div className="flex items-center gap-3 overflow-hidden absolute left-4 top-1/2 -translate-y-1/2">
                        {Icon && <Icon className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />}
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors truncate whitespace-nowrap">
                        {selectedOption ? selectedOption.label : "Select..."}
                    </span>
                    <ChevronDown 
                        className={cn(
                            "w-4 h-4 text-slate-400 transition-transform duration-300 group-hover:text-indigo-500 shrink-0",
                            isOpen && "rotate-180"
                        )} 
                    />
                </button>

                {isOpen && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-2">
                        {searchable && (
                            <div className="relative mb-2 px-1">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-300 font-medium"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        )}
                        <div className="max-h-60 overflow-y-auto scrollbar-hide">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((opt) => (
                                    <div
                                        key={opt.value}
                                        onClick={() => {
                                            onChange(opt.value);
                                            setIsOpen(false);
                                            setSearchQuery("");
                                        }}
                                        className={cn(
                                            "px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center justify-between group/item",
                                            value === opt.value
                                                ? "bg-indigo-50 text-indigo-600"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-indigo-500"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            {opt.icon && <opt.icon className="w-4 h-4 opacity-50 group-hover/item:opacity-100 transition-opacity" />}
                                            <span>{opt.label}</span>
                                        </div>
                                        {value === opt.value && <CheckCircle2 className="w-4 h-4 animate-in zoom-in duration-300" />}
                                    </div>
                                ))
                            ) : (
                                <div className="px-4 py-6 text-center">
                                    <p className="text-sm text-slate-400 font-medium">No results found</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
