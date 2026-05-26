import { ReactNode } from "react";

type Props = {
  title: string;
  right?: ReactNode;
  below?: ReactNode;
};

const PageHeader = ({ title, right, below }: Props) => {
  return (
    <div className="rounded-2xl border border-border bg-gradient-to-r from-primary/15 via-money-in/15 to-money-out/15 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{title}</h2>
        <div className="flex items-center gap-2">
          {right}
        </div>
      </div>
      {below && <div className="mt-3">{below}</div>}
    </div>
  );
};

export default PageHeader;
