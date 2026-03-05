"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FormSelectProps {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  options: { value: string; label: string }[];
  className?: string;
}

export function FormSelect({
  name,
  defaultValue,
  placeholder = "Seleccionar...",
  options,
  className,
}: FormSelectProps) {
  const [value, setValue] = useState(defaultValue || "");

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Select
        value={value || undefined}
        onValueChange={(v) => setValue(v === "__all__" ? "" : v)}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value || "__all__"} value={opt.value || "__all__"}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
