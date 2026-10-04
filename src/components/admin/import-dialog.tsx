"use client";

/**
 * CSV bulk-import dialog (Prompt 8). Pick a .csv file → preview is validated
 * server-side row by row → shows imported/failed counts with per-row reasons.
 * Includes a downloadable template so the expected columns are obvious.
 */

import * as React from "react";
import { CheckCircle2, Download, FileUp, Loader2, TriangleAlert } from "lucide-react";

import { api } from "@/lib/client";
import type { EnquiryImportResultDTO } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toastApiError } from "@/components/admin/admin-ui";

const TEMPLATE_CSV = [
  "name,phone,email,course,message",
  "Aarav Sharma,+91 98765 43210,aarav@example.com,Cabin Crew Training,Interested in the weekend batch",
  "Priya Nair,+91 91234 56789,,Ground Staff Training,Asked for fee details",
].join("\n");

const MAX_BYTES = 500_000;

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "skyora-enquiries-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportCsvDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful import so the parent list refreshes. */
  onImported: () => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<EnquiryImportResultDTO | null>(null);

  function reset() {
    setFile(null);
    setResult(null);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function pickFile(f: File | null) {
    setResult(null);
    if (!f) {
      setFile(null);
      return;
    }
    if (!/\.csv$/i.test(f.name)) {
      toastApiError(new Error("Please choose a .csv file."));
      return;
    }
    if (f.size > MAX_BYTES) {
      toastApiError(new Error("File is too large — maximum 500 KB."));
      return;
    }
    setFile(f);
  }

  async function doImport() {
    if (!file) return;
    setBusy(true);
    try {
      const csv = await file.text();
      const res = await api<EnquiryImportResultDTO>("/api/enquiries/import", {
        method: "POST",
        body: JSON.stringify({ csv, fileName: file.name }),
      });
      setResult(res);
      if (res.imported > 0) onImported();
    } catch (err) {
      toastApiError(err, "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent
        className="max-h-[85vh] w-[min(520px,calc(100vw-2rem))] overflow-y-auto border-2 border-ink bg-cream nice-scrollbar"
        style={{ boxShadow: "6px 6px 0 0 #0A0A0A" }}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl uppercase">
            Import Enquiries
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Upload a CSV of leads. Columns: <strong>name</strong>*,{" "}
            <strong>phone</strong>*, email, course, message. Course must match
            an active course title. Duplicate phone numbers are skipped.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border-2 border-ink bg-white p-4">
              <CheckCircle2
                className="size-8 shrink-0 text-brand-green"
                aria-hidden="true"
              />
              <div>
                <p className="font-grotesk text-lg font-bold">
                  {result.imported} of {result.total} imported
                </p>
                <p className="text-xs text-muted-foreground">
                  {result.failed.length === 0
                    ? "Every row was imported — nice file!"
                    : `${result.failed.length} row${
                        result.failed.length === 1 ? "" : "s"
                      } skipped (see below).`}
                </p>
              </div>
            </div>

            {result.failed.length > 0 ? (
              <div className="rounded-xl border-2 border-ink bg-white">
                <p className="flex items-center gap-2 border-b-2 border-ink px-4 py-2 font-grotesk text-xs font-bold uppercase">
                  <TriangleAlert
                    className="size-4 text-brand-orange"
                    aria-hidden="true"
                  />
                  Skipped rows
                </p>
                <ul className="nice-scrollbar max-h-48 divide-y divide-ink/10 overflow-y-auto">
                  {result.failed.map((f) => (
                    <li key={f.row} className="px-4 py-2 text-sm">
                      <span className="mr-2 font-grotesk font-bold text-brand-red">
                        #{f.row}
                      </span>
                      <span className="font-bold">{f.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {f.reason}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={reset}
                disabled={busy}
                className="border-2 border-ink bg-white font-grotesk font-bold"
              >
                Import another file
              </Button>
              <Button
                onClick={() => onOpenChange(false)}
                className="font-grotesk font-bold"
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-ink bg-white p-6 text-center transition-colors hover:bg-cream"
              aria-label="Choose a CSV file to import"
            >
              <FileUp className="size-8 text-muted-foreground" aria-hidden="true" />
              {file ? (
                <>
                  <span className="font-grotesk font-bold">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB — click to change
                  </span>
                </>
              ) : (
                <>
                  <span className="font-grotesk font-bold">
                    Click to choose a CSV file
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Max 500 KB · up to 500 rows
                  </span>
                </>
              )}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />

            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex items-center gap-1.5 self-start font-grotesk text-xs font-bold uppercase underline underline-offset-4 hover:text-brand-pink"
            >
              <Download className="size-3.5" aria-hidden="true" />
              Download CSV template
            </button>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={busy}
                className="border-2 border-ink bg-white font-grotesk font-bold"
              >
                Cancel
              </Button>
              <Button onClick={() => void doImport()} disabled={!file || busy}>
                {busy ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : null}
                {busy ? "Importing…" : "Import"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
