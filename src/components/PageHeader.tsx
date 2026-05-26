import { ReactNode } from "react";
import { useApp } from "@/contexts/AppContext";

type Props = {
  title: string;
  subtitle?: string | null;
  right?: ReactNode;
  below?: ReactNode;
};

const PageHeader = ({ title, subtitle, right, below }: Props) => {
  const { mode, displayBusinessName } = useApp();
  const businessSubtitle =
    mode === "business" ? (subtitle ?? displayBusinessName) : subtitle;

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-r from-primary/15 via-money-in/15 to-money-out/15 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold">{title}</h2>
          {businessSubtitle && (
            <p className="text-xs font-medium text-muted-foreground truncate mt-0.5">{businessSubtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {right}
        </div>
      </div>
      {below && <div className="mt-3">{below}</div>}
    </div>
  );
};

export default PageHeader;
