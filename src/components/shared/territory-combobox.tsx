"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export interface TerritoryOption {
  id: string;
  name: string;
}

interface TerritoryComboboxProps {
  value: TerritoryOption | null;
  options: TerritoryOption[];
  onChange: (territory: TerritoryOption) => void;
  placeholder?: string;
}

export function TerritoryCombobox({
  value,
  options,
  onChange,
  placeholder = "Select...",
}: TerritoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = options.filter((opt) =>
    opt.name.toLowerCase().includes(search.toLowerCase())
  );
  const showCreate =
    search.length > 0 &&
    !options.some((opt) => opt.name.toLowerCase() === search.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[140px] h-8 justify-between text-sm font-normal"
        >
          <span className="truncate">{value?.name || placeholder}</span>
          <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search territory..."
            value={search}
            onValueChange={setSearch}
            className="h-8"
          />
          <CommandList>
            <CommandEmpty>No territories found.</CommandEmpty>
            <CommandGroup>
              {filtered.map((opt) => (
                <CommandItem
                  key={opt.id}
                  value={opt.id}
                  onSelect={() => {
                    onChange(opt);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value?.id === opt.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {opt.name}
                </CommandItem>
              ))}
              {showCreate && (
                <CommandItem
                  value={`create-${search}`}
                  onSelect={async () => {
                    try {
                      const res = await fetch("/api/users/territories", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: search }),
                      });
                      if (res.ok) {
                        const territory = await res.json();
                        onChange(territory);
                      }
                    } catch {
                      // silent fail - user can retry
                    }
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  Create &ldquo;{search}&rdquo;
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
