"use client";

import { FormEvent, useEffect, useState } from "react";

type AddDebtorInput = {
  name: string;
  phone: string;
};

type AddDebtorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (debtor: AddDebtorInput) => void | Promise<void>;
};

export function AddDebtorModal({ isOpen, onClose, onSubmit }: AddDebtorModalProps) {
  const [form, setForm] = useState({ name: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setForm({ name: "", phone: "" });
      setSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      setSubmitting(true);

      await onSubmit({
        name: form.name.trim(),
        phone: form.phone.trim(),
      });

      setForm({ name: "", phone: "" });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div dir="rtl" className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4"
      >
        <h2 className="text-lg font-semibold text-slate-900">افزودن بدهکار جدید</h2>

        <input
          className="input"
          placeholder="نام بدهکار"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          className="input"
          placeholder="شماره همراه (اختیاری)"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />

        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full border border-slate-200 py-2 text-sm text-slate-600"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-indigo-600 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "در حال ذخیره..." : "ذخیره"}
          </button>
        </div>
      </form>
    </div>
  );
}
