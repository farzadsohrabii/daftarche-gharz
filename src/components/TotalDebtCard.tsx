type TotalDebtCardProps = {
    total: number;
};

export function TotalDebtCard({ total }: TotalDebtCardProps) {
    return (
        <section dir="rtl" className="w-60 h-20 rounded-xl bg-white/60 backdrop-blur-2xl shadow flex flex-col gap-2 ml-auto items-center justify-center mt-">
            <div className=" w-[90%] h-[90%] rounded-xl pr-3 pt-3">
                <p className="text-sm text-slate-500">جمع کل بدهی‌ها</p>
                <p className="text-xl font-semibold text-slate-900">
                    {total.toLocaleString("fa-IR")} تومان
                </p>
            </div>
        </section>
    );
}
