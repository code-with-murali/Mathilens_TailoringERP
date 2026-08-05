import type { PaginationMeta } from "@/lib/api-client";
import { Button } from "./Button";

type PaginationProps = {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
};

/** 00_MASTER_SPEC.md § 9.6 Tables — pagination consistent with the § 8.3 API contract. */
export function Pagination({ meta, onPageChange }: PaginationProps) {
  if (meta.totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between text-sm text-foreground/70">
      <span>
        Page {meta.page} of {meta.totalPages} ({meta.totalCount} total)
      </span>
      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={() => onPageChange(meta.page - 1)} disabled={meta.page <= 1}>
          Previous
        </Button>
        <Button type="button" variant="secondary" onClick={() => onPageChange(meta.page + 1)} disabled={meta.page >= meta.totalPages}>
          Next
        </Button>
      </div>
    </div>
  );
}
