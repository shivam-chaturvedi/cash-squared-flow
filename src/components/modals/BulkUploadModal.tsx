import { useRef, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Upload, FileSpreadsheet } from "lucide-react";
import { db } from "@/lib/db";
import { emitDataChanged } from "@/lib/events";

interface Props {
  open: boolean;
  onClose: () => void;
  type: "customers" | "suppliers";
  userId: string;
  onUploaded?: () => void;
}

const BulkUploadModal = ({ open, onClose, type, userId, onUploaded }: Props) => {
  const { language } = useApp();
  const tr = t[language];
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const parseNumber = (raw: unknown) => {
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (typeof raw === "string") {
      const cleaned = raw.trim().replace(/,/g, "");
      if (!cleaned) return 0;
      const value = Number(cleaned);
      return Number.isFinite(value) ? value : 0;
    }
    return 0;
  };

  const normalizeRecord = (raw: Record<string, unknown>) => {
    const get = (...keys: string[]) => {
      for (const key of keys) {
        const match = Object.keys(raw).find((k) => k.trim().toLowerCase() === key.trim().toLowerCase());
        if (!match) continue;
        const value = raw[match];
        if (value === null || typeof value === "undefined") return "";
        return String(value).trim();
      }
      return "";
    };
    return {
      name: get("name", "customer_name", "supplier_name"),
      phone: get("phone", "mobile", "phone_number"),
      email: get("email", "mail"),
      balance: parseNumber(get("balance", "opening_balance", "amount")),
    };
  };

  const processFile = async (file: File) => {
    setUploading(true);
    setMessage(null);
    setErrorMessage(null);
    try {
      const buffer = await file.arrayBuffer();
      const text = new TextDecoder().decode(buffer);
      const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
      if (lines.length < 2) {
        setErrorMessage("CSV must include headers and at least one row.");
        setUploading(false);
        return;
      }
      const headers = lines[0].split(",").map((h) => h.trim());
      const rawRows: Record<string, unknown>[] = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        const row: Record<string, unknown> = {};
        headers.forEach((header, index) => {
          row[header] = values[index] ?? "";
        });
        return row;
      });
      const rows = rawRows.map(normalizeRecord).filter((row) => !!row.name);

      if (rows.length === 0) {
        setErrorMessage("No valid rows found. Add at least a 'name' column and values.");
        setUploading(false);
        return;
      }

      let success = 0;
      let failed = 0;
      for (const row of rows) {
        if (type === "customers") {
          const res = await db.business.addCustomer({
            user_id: userId,
            name: row.name,
            phone: row.phone || undefined,
            email: row.email || undefined,
            balance: row.balance,
          });
          if (res.data) success += 1;
          else failed += 1;
        } else {
          const res = await db.business.addSupplier({
            user_id: userId,
            name: row.name,
            phone: row.phone || undefined,
            email: row.email || undefined,
            balance: row.balance,
          });
          if (res.data) success += 1;
          else failed += 1;
        }
      }

      emitDataChanged();
      onUploaded?.();
      setMessage(`Imported ${success} row(s)${failed > 0 ? `, failed ${failed}` : ""}.`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Unable to process file.");
    }
    setUploading(false);
  };

  const onBrowse = () => inputRef.current?.click();

  const downloadTemplate = () => {
    const csv = [
      "name,phone,email,balance",
      "John Doe Traders,9876543210,john@example.com,1200",
      "Acme Retail,9123456780,acme@example.com,-450",
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${type}-bulk-upload-template.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tr.bulkUpload} {type === "customers" ? tr.customers : tr.suppliers}</DialogTitle>
          <DialogDescription>Upload a CSV or Excel file to add multiple entries at once</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && file.name.toLowerCase().endsWith(".csv")) {
                void processFile(file);
              } else if (file) {
                setErrorMessage("Only CSV files are supported.");
              }
              e.currentTarget.value = "";
            }}
          />
          <div
            className="border-2 border-dashed border-border p-8 text-center hover:border-primary transition cursor-pointer"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file && file.name.toLowerCase().endsWith(".csv")) {
                void processFile(file);
              } else if (file) {
                setErrorMessage("Only CSV files are supported.");
              }
            }}
            onClick={onBrowse}
          >
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium">Drag & drop your file here</p>
            <p className="text-xs text-muted-foreground mt-1">CSV supported</p>
            <button type="button" className="mt-4 border border-input px-4 py-2 text-sm font-medium hover:bg-accent transition">Browse Files</button>
          </div>
          <div className="flex items-center gap-2 p-3 bg-muted text-xs">
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Download our <button type="button" onClick={downloadTemplate} className="text-primary font-medium underline">sample template</button> for the correct format</span>
          </div>
          {message && <p className="text-xs text-money-in">{message}</p>}
          {errorMessage && <p className="text-xs text-destructive">{errorMessage}</p>}
          <button disabled={uploading} onClick={onClose} className="w-full bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-60">{uploading ? "Uploading..." : tr.bulkUpload}</button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkUploadModal;
