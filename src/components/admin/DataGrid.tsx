import { type ReactNode, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { Page, QueryParams } from "@/lib/mock/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface GridColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  cell: (row: T) => ReactNode;
}

export interface GridFilter {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface DataGridProps<T> {
  queryKey: readonly unknown[];
  fetchPage: (params: QueryParams) => Promise<Page<T>>;
  columns: GridColumn<T>[];
  filters?: GridFilter[];
  searchPlaceholder?: string;
  initialSort?: { sortBy: string; sortDir: "asc" | "desc" };
  pageSize?: number;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  toolbar?: ReactNode;
}

export function DataGrid<T extends { _id: string }>({
  queryKey,
  fetchPage,
  columns,
  filters = [],
  searchPlaceholder = "Search...",
  initialSort,
  pageSize: initialPageSize = 10,
  emptyMessage = "No records found.",
  onRowClick,
  toolbar,
}: DataGridProps<T>) {
  const [params, setParams] = useState<QueryParams>({
    page: 1,
    pageSize: initialPageSize,
    search: "",
    sortBy: initialSort?.sortBy,
    sortDir: initialSort?.sortDir ?? "asc",
    filters: {},
  });

  const { data, isFetching, isLoading } = useQuery({
    queryKey: [...queryKey, params],
    queryFn: () => fetchPage(params),
    placeholderData: keepPreviousData,
  });

  const total = data?.total ?? 0;
  const pageSize = params.pageSize ?? initialPageSize;
  const page = params.page ?? 1;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const toggleSort = (key: string) => {
    setParams((p) => ({
      ...p,
      page: 1,
      sortBy: key,
      sortDir: p.sortBy === key && p.sortDir === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative w-full md:max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={params.search ?? ""}
              onChange={(e) => setParams((p) => ({ ...p, page: 1, search: e.target.value }))}
              placeholder={searchPlaceholder}
              className="pl-8"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((f) => (
            <Select
              key={f.key}
              value={params.filters?.[f.key] ?? "all"}
              onValueChange={(v) =>
                setParams((p) => ({ ...p, page: 1, filters: { ...p.filters, [f.key]: v } }))
              }
            >
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder={f.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {f.label}</SelectItem>
                {f.options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
          {toolbar}
        </div>
      </div>

      <div className="-mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={{ width: c.width }}
                  className={cn("px-4 py-2.5 font-medium", c.sortable && "cursor-pointer select-none")}
                  onClick={() => c.sortable && toggleSort(c.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.header}
                    {c.sortable && params.sortBy === c.key && (
                      params.sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border/60">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3">
                      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data?.data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data?.data.map((row) => (
                <tr
                  key={row._id}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "border-b border-border/60 transition-colors",
                    onRowClick && "cursor-pointer hover:bg-accent/40",
                  )}
                >
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3 align-middle">
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2 border-t border-border p-3 text-sm md:flex-row md:items-center md:justify-between">
        <div className="text-muted-foreground">
          {isFetching && !isLoading ? "Updating… " : ""}
          {total === 0 ? "0 results" : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={String(pageSize)}
            onValueChange={(v) => setParams((p) => ({ ...p, page: 1, pageSize: Number(v) }))}
          >
            <SelectTrigger className="h-8 w-[90px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setParams((p) => ({ ...p, page: 1 }))}><ChevronsLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) - 1 }))}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="px-2 text-xs text-muted-foreground">Page {page} / {totalPages}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setParams((p) => ({ ...p, page: totalPages }))}><ChevronsRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
