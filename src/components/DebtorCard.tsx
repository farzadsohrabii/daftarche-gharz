import { Debtor } from "@/types/debtor";
import { motion } from "framer-motion";

type DebtorCardProps = {
  debtor: Debtor;
  onEdit: () => void;
  onDelete: () => void | Promise<void>;
  onSettle: () => void | Promise<void>;
};

export function DebtorCard({ debtor, onEdit, onDelete, onSettle }: DebtorCardProps) {
  const debts = debtor.debts ?? [];
  const total = debts.reduce((sum, d) => sum + Number(d.amount || 0), 0);

  const lastDate =
    debts.length > 0
      ? [...debts].sort((a, b) => (a.debt_date < b.debt_date ? 1 : -1))[0].debt_date
      : "-";

  return (
    <motion.div
      layout
      whileHover={{ y: -2, scale: 1.005 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
      className="w-full rounded-2xl border border-white/15 bg-white/10 p-4 text-right shadow-xl backdrop-blur-xl"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-bold text-white">{debtor.name}</p>
          <p className="mt-1 text-xs text-white/70">
            {debtor.phone ? `📞 ${debtor.phone}` : "شماره ثبت نشده"}
          </p>
        </div>

        <div className="rounded-xl border border-indigo-300/30 bg-indigo-500/20 px-3 py-1.5">
          <p className="text-sm font-semibold text-indigo-100">
            {total.toLocaleString("fa-IR")} تومان
          </p>
        </div>
      </div>

      {/* Meta */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/80">
          آخرین تاریخ: <span className="font-medium text-white">{lastDate}</span>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/80">
          تعداد قرض: <span className="font-medium text-white">{debts.length}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-xl border border-indigo-300/30 bg-indigo-500/20 px-3 py-2 text-xs font-medium text-indigo-100 transition hover:bg-indigo-500/30"
        >
          ویرایش
        </button>

        <button
          type="button"
          onClick={onSettle}
          className="rounded-xl border border-emerald-300/30 bg-emerald-500/20 px-3 py-2 text-xs font-medium text-emerald-100 transition hover:bg-emerald-500/30"
        >
          تسویه
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="rounded-xl border border-rose-300/30 bg-rose-500/20 px-3 py-2 text-xs font-medium text-rose-100 transition hover:bg-rose-500/30"
        >
          حذف
        </button>
      </div>
    </motion.div>
  );
}
