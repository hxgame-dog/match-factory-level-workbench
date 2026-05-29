"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ItemFiltersProps = {
  search: string;
  category1: string;
  color1: string;
  size: string;
  options: {
    category1: string[];
    color1: string[];
    size: string[];
  };
  onChange: (next: {
    search?: string;
    category1?: string;
    color1?: string;
    size?: string;
  }) => void;
};

export function ItemFilters(props: ItemFiltersProps) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <Input
        placeholder="搜索 Name / Category"
        value={props.search}
        onChange={(event) => props.onChange({ search: event.target.value })}
      />
      <Select
        value={props.category1 || "all"}
        onValueChange={(value) =>
          props.onChange({ category1: value && value !== "all" ? value : "" })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="筛选 Category1" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部 Category1</SelectItem>
          {props.options.category1.map((it) => (
            <SelectItem key={it} value={it}>
              {it}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={props.color1 || "all"}
        onValueChange={(value) =>
          props.onChange({ color1: value && value !== "all" ? value : "" })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="筛选 Color1" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部 Color1</SelectItem>
          {props.options.color1.map((it) => (
            <SelectItem key={it} value={it}>
              {it}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={props.size || "all"}
        onValueChange={(value) =>
          props.onChange({ size: value && value !== "all" ? value : "" })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="筛选 Size" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部 Size</SelectItem>
          {props.options.size.map((it) => (
            <SelectItem key={it} value={it}>
              {it}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
