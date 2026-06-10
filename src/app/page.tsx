"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { TotalDebtCard } from "@/components/TotalDebtCard";
import { DebtorCard } from "@/components/DebtorCard";
import { AddDebtorModal } from "@/components/AddDebtorModal";
import { EditDebtorModal } from "@/components/EditDebtorModal";
import type { Debtor, DebtItem } from "@/types/debtor";

const toTime = (v?: string | null) => (v ? new Date(v).getTime() : 0);

export default function Page() {
  const router = useRouter();

  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);

  const totalDebt = useMemo(() => {
    return debtors.reduce((sum, debtor) => {
      const debtorTotal = (debtor.debts ?? []).reduce(
        (s, d) => s + Number(d.amount || 0),
        0
      );
      return sum + debtorTotal;
    }, 0);
  }, [debtors]);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });
        const json = await res.json().catch(() => null);

        if (!mounted) return;

        const uid = json?.user?.id as string | undefined;
        if (!res.ok || !json?.ok || !uid) {
          setUserId(null);
          setDebtors([]);
          setLoading(false);
          router.replace("/auth");
          return;
        }

        setUserId(uid);
        await loadDebtors(uid);
        setLoading(false);
      } catch (e) {
        if (!mounted) return;
        console.error("INIT_AUTH_ERROR:", e);
        setUserId(null);
        setDebtors([]);
        setLoading(false);
        router.replace("/auth");
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, [router]);

  const loadDebtors = async (uid: string) => {
    const { data, error } = await supabase
      .from("debtors")
      .select(`
        id,
        user_id,
        name,
        phone,
        date,
        created_at,
        debts (
          id,
          debtor_id,
          user_id,
          amount,
          debt_date,
          note,
          created_at
        )
      `)
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load debtors error:", error);
      return;
    }

    const normalized = ((data ?? []) as Debtor[]).map((d) => ({
      ...d,
      debts: [...(d.debts ?? [])].sort(
        (a, b) => toTime(b.created_at) - toTime(a.created_at)
      ),
    }));

    setDebtors(normalized);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("LOGOUT_ERROR:", e);
    } finally {
      setUserId(null);
      setDebtors([]);
      router.replace("/auth");
    }
  };

  const handleAddDebtor = async (payload: { name: string; phone: string }) => {
    if (!userId) {
      router.replace("/auth");
      return;
    }

    const insertPayload = {
      id: crypto.randomUUID(),
      user_id: userId,
      name: payload.name.trim(),
      phone: payload.phone?.trim() || "",
      date: new Date().toISOString().slice(0, 10),
    };

    const { data, error } = await supabase
      .from("debtors")
      .insert(insertPayload)
      .select("id,user_id,name,phone,date,created_at")
      .single();

    if (error) {
      console.error("Add debtor error:", error);
      alert("خطا در افزودن بدهکار: " + error.message);
      return;
    }

    const newDebtor: Debtor = {
      ...(data as Debtor),
      debts: [],
    };

    setDebtors((prev) => [newDebtor, ...prev]);
    setIsAddModalOpen(false);
  };

  const handleSaveProfile = async (payload: {
    id: string;
    name: string;
    phone: string;
  }) => {
    const { error } = await supabase
      .from("debtors")
      .update({
        name: payload.name.trim(),
        phone: payload.phone?.trim() || "",
      })
      .eq("id", payload.id);

    if (error) {
      alert("خطا در ذخیره مشخصات: " + error.message);
      return;
    }

    setDebtors((prev) =>
      prev.map((d) =>
        d.id === payload.id
          ? {
              ...d,
              name: payload.name.trim(),
              phone: payload.phone?.trim() || "",
            }
          : d
      )
    );

    setSelectedDebtor((prev) =>
      prev && prev.id === payload.id
        ? {
            ...prev,
            name: payload.name.trim(),
            phone: payload.phone?.trim() || "",
          }
        : prev
    );
  };

  const handleAddDebt = async (payload: {
    debtorId: string;
    amount: number;
    debt_date: string; // متن آزاد
    note?: string;
  }) => {
    if (!userId) {
      router.replace("/auth");
      return;
    }

    const debtDateRaw = payload.debt_date?.trim() || "";

    const { data, error } = await supabase
      .from("debts")
      .insert({
        debtor_id: payload.debtorId,
        user_id: userId,
        amount: Number(payload.amount),
        debt_date: debtDateRaw, // بدون تبدیل
        note: payload.note?.trim() || null,
      })
      .select("*")
      .single();

    if (error) {
      alert("خطا در افزودن قرض: " + error.message);
      return;
    }

    const newDebt = data as DebtItem;

    setDebtors((prev) =>
      prev.map((d) =>
        d.id === payload.debtorId
          ? { ...d, debts: [newDebt, ...(d.debts ?? [])] }
          : d
      )
    );

    setSelectedDebtor((prev) =>
      prev && prev.id === payload.debtorId
        ? { ...prev, debts: [newDebt, ...(prev.debts ?? [])] }
        : prev
    );
  };

  const handleDeleteDebtItem = async (debtId: string) => {
    const { error } = await supabase.from("debts").delete().eq("id", debtId);

    if (error) {
      alert("خطا در حذف آیتم بدهی: " + error.message);
      return;
    }

    setDebtors((prev) =>
      prev.map((d) => ({
        ...d,
        debts: (d.debts ?? []).filter((x) => x.id !== debtId),
      }))
    );

    setSelectedDebtor((prev) =>
      prev
        ? { ...prev, debts: (prev.debts ?? []).filter((x) => x.id !== debtId) }
        : prev
    );
  };

  const handleDeleteDebtor = async (id: string) => {
    const { error } = await supabase.from("debtors").delete().eq("id", id);

    if (error) {
      alert("خطا در حذف: " + error.message);
      return;
    }

    setDebtors((prev) => prev.filter((d) => d.id !== id));

    if (selectedDebtor?.id === id) {
      setSelectedDebtor(null);
      setIsEditModalOpen(false);
    }
  };

  const handleSettleDebtor = async (debtorId: string) => {
    const { error } = await supabase.from("debts").delete().eq("debtor_id", debtorId);

    if (error) {
      alert("خطا در تسویه: " + error.message);
      return;
    }

    setDebtors((prev) =>
      prev.map((d) => (d.id === debtorId ? { ...d, debts: [] } : d))
    );
    setSelectedDebtor((prev) =>
      prev && prev.id === debtorId ? { ...prev, debts: [] } : prev
    );
  };

  const openEditModal = (debtor: Debtor) => {
    setSelectedDebtor(debtor);
    setIsEditModalOpen(true);
  };

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.07, delayChildren: 0.05 },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 16, scale: 0.98 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 180,
        damping: 18,
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.98,
      transition: { duration: 0.2 },
    },
  };

  if (loading) {
    return (
      <main dir="rtl" className="relative min-h-screen overflow-hidden bg-[#0f172a] text-white">
        <AnimatedBackground />
        <div className="mx-auto w-full max-w-md p-4 pt-8">
          <div className="mb-4 h-12 w-12 animate-pulse rounded-2xl bg-white/20" />
          <div className="mb-4 h-36 animate-pulse rounded-3xl bg-white/10 backdrop-blur" />
          <div className="mb-3 h-12 animate-pulse rounded-2xl bg-white/10" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/10" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="relative min-h-screen overflow-hidden bg-[#0b1020] text-slate-100">
      <AnimatedBackground />

      <div className="sticky top-0 z-30 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-md items-center justify-between px-4 py-3">
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-medium text-white/90"
          >
            دفترچه قرض
          </motion.h1>

          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            onClick={handleLogout}
            title="خروج"
            aria-label="خروج از حساب"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white shadow-lg backdrop-blur-md transition hover:bg-white/20"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
          </motion.button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md px-4 pb-6 pt-4">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 16 }}
          className="rounded-3xl border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur-xl"
        >
          <TotalDebtCard total={totalDebt} />
          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ y: -1 }}
            onClick={() => setIsAddModalOpen(true)}
            className="mt-3 w-full rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 py-3 font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:brightness-110"
          >
            + افزودن بدهکار
          </motion.button>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-4 rounded-3xl border border-white/15 bg-white/10 p-3 backdrop-blur-xl"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-white">لیست بدهکاران</h2>
            <span className="rounded-xl border border-white/20 bg-white/10 px-2 py-1 text-xs text-white/80">
              {debtors.length} نفر
            </span>
          </div>

          {debtors.length === 0 ? (
            <EmptyState onAdd={() => setIsAddModalOpen(true)} />
          ) : (
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
              <AnimatePresence mode="popLayout">
                {debtors.map((debtor) => (
                  <motion.div key={debtor.id} variants={item} layout initial="hidden" animate="show" exit="exit">
                    <DebtorCard
                      debtor={debtor}
                      onEdit={() => openEditModal(debtor)}
                      onDelete={() => handleDeleteDebtor(debtor.id)}
                      onSettle={() => handleSettleDebtor(debtor.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.section>
      </div>

      <AddDebtorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddDebtor}
      />

      <EditDebtorModal
        isOpen={isEditModalOpen}
        debtor={selectedDebtor}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedDebtor(null);
        }}
        onSaveProfile={handleSaveProfile}
        onAddDebt={handleAddDebt}
        onDeleteDebt={handleDeleteDebtItem}
        onSettle={handleSettleDebtor}
      />
    </main>
  );
}

function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        animate={{ x: [0, 25, -20, 0], y: [0, -18, 15, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-3xl"
      />
      <motion.div
        animate={{ x: [0, -20, 10, 0], y: [0, 20, -15, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-16 top-1/3 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl"
      />
      <motion.div
        animate={{ x: [0, 10, -10, 0], y: [0, -12, 8, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-orange-400/20 blur-3xl"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.07),transparent_55%)]" />
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-dashed border-white/25 bg-white/5 p-6 text-center"
    >
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-white/80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <p className="text-sm text-white/80">هنوز بدهکاری ثبت نشده</p>
      <button
        onClick={onAdd}
        className="mt-3 rounded-xl bg-white/15 px-4 py-2 text-sm text-white transition hover:bg-white/25"
      >
        اولین بدهکار را اضافه کن
      </button>
    </motion.div>
  );
}
