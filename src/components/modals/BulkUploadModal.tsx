import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Upload, FileSpreadsheet } from "lucide-react";

interface Props { open: boolean; onClose: () => void; type: "customers" | "suppliers"; }

const BulkUploadModal = ({ open, onClose, type }: Props) => {
  const { language } = useApp();
  const tr = t[language];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tr.bulkUpload} {type === "customers" ? tr.customers : tr.suppliers}</DialogTitle>
          <DialogDescription>Upload a CSV or Excel file to add multiple entries at once</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-border p-8 text-center hover:border-primary transition cursor-pointer">
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium">Drag & drop your file here</p>
            <p className="text-xs text-muted-foreground mt-1">CSV, XLS, XLSX supported</p>
            <button className="mt-4 border border-input px-4 py-2 text-sm font-medium hover:bg-accent transition">Browse Files</button>
          </div>
          <div className="flex items-center gap-2 p-3 bg-muted text-xs">
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Download our <button className="text-primary font-medium underline">sample template</button> for the correct format</span>
          </div>
          <button onClick={onClose} className="w-full bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:opacity-90">{tr.bulkUpload}</button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkUploadModal;
