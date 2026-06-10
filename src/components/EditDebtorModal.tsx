"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Debtor } from "@/types/debtor";

type EditDebtorModalProps = {
  debtor: Debtor | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveProfile: (payload: { id: string; name: string; phone: string }) => Promise<void> | void;
  onAddDebt: (payload: { debtorId: string; amount: number; debt_date: string; note?: string }) => Promise<void>;
  onDeleteDebt: (debtId: string) => Promise<void>;
  onSettle: (debtorId: string) => Promise<void> | void;
};

export function EditDebtorModal({
  debtor,
  isOpen,
  onClose,
  onSaveProfile,
  onAddDebt,
  onDeleteDebt,
  onSettle,
}: EditDebtorModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // مبلغ را رشته‌ای نگه می‌داریم تا بتوانیم فرمت ویرگول‌دار نشان دهیم
  const [amount, setAmount] = useState<string>("");

  // تاریخ فقط رشته خام
  const [debtDate, setDebtDate] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [addingDebt, setAddingDebt] = useState(false);

  useEffect(() => {
    if (!debtor) return;
    setName(debtor.name ?? "");
    setPhone(debtor.phone ?? "");
    setAmount("");
    setDebtDate("");
    setNote("");
  }, [debtor]);

  const total = useMemo(
    () => (debtor?.debts ?? []).reduce((sum, d) => sum + Number(d.amount || 0), 0),
    [debtor]
  );

  if (!isOpen || !debtor) return null;

  // فقط عددها را نگه می‌دارد و فرمت سه‌تا‌سه‌تا اعمال می‌کند
  const formatAmount = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";
    return Number(digits).toLocaleString("en-US"); // 1,234,567
  };

  // از مقدار فرمت‌شده، عدد واقعی می‌سازد
  const toAmountNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits ? Number(digits) : 0;
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("نام را وارد کنید");

    try {
      setSavingProfile(true);
      await onSaveProfile({
        id: debtor.id,
        name: name.trim(),
        phone: phone.trim(),
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddDebt = async () => {
    const amountNumber = toAmountNumber(amount);

    if (!amountNumber || amountNumber <= 0) return alert("مبلغ معتبر وارد کنید");
    if (!debtDate.trim()) return alert("تاریخ را وارد کنید (مثلاً 1405/03/16)");

    try {
      setAddingDebt(true);
      await onAddDebt({
        debtorId: debtor.id,
        amount: amountNumber,
        debt_date: debtDate.trim(), // رشته خام
        note: note.trim() || undefined,
      });

      setAmount("");
      setDebtDate("");
      setNote("");
    } finally {
      setAddingDebt(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-md max-h-[90vh] overflow-auto rounded-3xl border border-white/20 bg-white/10 p-4 text-right shadow-2xl backdrop-blur-2xl"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 180, damping: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-white">ویرایش بدهکار</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/20 bg-white/10 px-2 py-1 text-xs text-white/80 hover:bg-white/20"
            >
              بستن
            </button>
          </div>

          <div className="mb-4 rounded-2xl border border-indigo-300/30 bg-indigo-500/20 p-3">
            <p className="text-xs text-indigo-100/90">جمع کل بدهی</p>
            <p className="mt-1 text-xl font-bold text-white">
              {total.toLocaleString("fa-IR")} تومان
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-2">
            <input
              className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 outline-none focus:border-indigo-300/40"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="نام"
            />
            <input
              className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 outline-none focus:border-indigo-300/40"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="تلفن"
            />
            <button
              disabled={savingProfile}
              type="submit"
              className="w-full rounded-xl bg-indigo-500 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:opacity-60"
            >
              {savingProfile ? "در حال ذخیره..." : "ذخیره مشخصات"}
            </button>
          </form>

          <div className="mt-4 rounded-2xl border border-white/15 bg-white/5 p-3 space-y-2">
            <p className="text-sm font-semibold text-white">افزودن قرض جدید</p>

            <input
              className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 outline-none"
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(formatAmount(e.target.value))}
              placeholder="مبلغ (تومان)"
              dir="ltr"
            />

            <input
              className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 outline-none"
              type="text"
              value={debtDate}
              onChange={(e) => setDebtDate(e.target.value)}
              placeholder="تاریخ (رشته) - مثال: 1405/03/16"
              dir="ltr"
            />

            <input
              className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 outline-none"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="توضیح (اختیاری)"
            />

            <div className="flex flex-wrap gap-2">
              {[100000, 500000, 1000000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    const current = toAmountNumber(amount);
                    setAmount(formatAmount(String(current + preset)));
                  }}
                  className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white/90 hover:bg-white/20"
                >
                  + {preset.toLocaleString("fa-IR")}
                </button>
              ))}
            </div>

            <button
              disabled={addingDebt}
              type="button"
              onClick={handleAddDebt}
              className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {addingDebt ? "در حال افزودن..." : "افزودن قرض"}
            </button>
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-sm font-semibold text-white">لیست قرض‌ها</p>

            {(debtor.debts ?? []).length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/20 bg-white/5 p-3 text-sm text-white/70">
                هنوز قرضی ثبت نشده.
              </p>
            ) : (
              [...(debtor.debts ?? [])]
                .sort((a, b) => (a.debt_date < b.debt_date ? 1 : -1))
                .map((d) => (
                  <div
                    key={d.id}
                    className="rounded-xl border border-white/15 bg-white/10 p-3 flex items-center justify-between gap-2"
                  >
                    <div className="text-sm">
                      <p className="font-semibold text-white">
                        {Number(d.amount).toLocaleString("fa-IR")} تومان
                      </p>
                      <p className="text-white/70 text-xs">{d.debt_date}</p>
                      {d.note ? <p className="text-white/60 text-xs mt-1">{d.note}</p> : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteDebt(d.id)}
                      className="rounded-lg border border-rose-300/30 bg-rose-500/20 px-3 py-1.5 text-xs text-rose-100 hover:bg-rose-500/30"
                    >
                      حذف
                    </button>
                  </div>
                ))
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onSettle(debtor.id)}
              className="flex-1 rounded-xl border border-emerald-300/30 bg-emerald-500/20 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/30"
            >
              تسویه کامل
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/20 bg-white/10 py-2.5 text-sm text-white/90 hover:bg-white/20"
            >
              بستن
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
