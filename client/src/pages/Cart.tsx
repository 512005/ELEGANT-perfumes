import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Loader2, Minus, MessageCircle, Instagram, Printer, ShieldCheck, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import StoreHeader from "@/components/StoreHeader";
import PerfumeImage from "@/components/PerfumeImage";
import { useCart } from "@/contexts/CartContext";
import { useLanguage, bi } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";

const SHIPPING_FEE = 60;
const money = (value: number) => `${new Intl.NumberFormat("en-US").format(value)} EGP`;

export default function CartPage() {
  const { items, total, removeItem, clear } = useCart();
  const { language, isArabic } = useLanguage();
  const [, navigate] = useLocation();
  const [submittedOrder, setSubmittedOrder] = useState<{ orderNumber: string; total: number; items: typeof items; address: string } | null>(null);
  const [form, setForm] = useState({ customerName: "", phone: "", governorate: "", area: "", address: "", notes: "" });
  const releaseReservation = trpc.products.release.useMutation();
  const createOrder = trpc.orders.create.useMutation({
    onSuccess: (result) => {
      setSubmittedOrder({ orderNumber: result.orderNumber, total: result.total, items, address: `${form.governorate}، ${form.area}، ${form.address}` });
      clear();
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (error) => toast.error(error.message),
  });
  const earliestExpiry = items.length ? Math.min(...items.map((item) => item.reservationExpiresAt)) : null;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!items.length) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [items.length]);
  useEffect(() => {
    const expired = items.filter((item) => item.reservationExpiresAt <= now);
    for (const item of expired) {
      void releaseReservation.mutateAsync({ productId: item.id, reservationToken: item.reservationToken });
      removeItem(item.id);
    }
  }, [now]);
  const remainingMs = earliestExpiry ? Math.max(0, earliestExpiry - now) : 0;
  const countdown = `${String(Math.floor(remainingMs / 60000)).padStart(2, "0")}:${String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, "0")}`;

  if (submittedOrder) {
    const waText = encodeURIComponent(
      `مرحباً Elegant! أود تأكيد طلبي رقم ${submittedOrder.orderNumber} باسم ${form.customerName} بقيمة ${submittedOrder.total} ج.م.`
    );
    const waUrl = `https://wa.me/201103419006?text=${waText}`;

    return <div dir={isArabic ? "rtl" : "ltr"} className="min-h-screen bg-[#f5f6f8] text-[#0c1017]"><StoreHeader /><main className="container flex min-h-[70vh] items-center justify-center py-20"><div className="printable-order w-full max-w-lg rounded-[30px] border border-[#c9d1dc] bg-white/70 p-8 text-center shadow-xl shadow-[#6d4b49]/5 sm:p-12"><div className="mb-7 flex items-center justify-between border-b border-[#d9dee6] pb-5"><div className="text-right"><div className="font-display text-2xl tracking-[0.14em] text-[#0c1017]">Elegant</div><div className="mt-1 text-[9px] uppercase tracking-[0.28em] text-[#7e8b9e]">fine fragrance · order receipt</div></div><a href="https://www.instagram.com/elegant.store.perfume?stkn=MzRlODBiNWFlZA==" target="_blank" rel="noreferrer" className="no-print inline-flex items-center gap-2 rounded-full border border-[#c9d1dc] bg-[#ffffff] px-3 py-2 text-xs text-[#657286] transition hover:border-[#52647b] hover:text-[#52647b]" aria-label="Elegant on Instagram"><Instagram size={16} /><span>@elegant.store.perfume</span></a></div><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#e4f0e5] text-[#4e885e]"><CheckCircle2 size={42} strokeWidth={1.4} /></div><p className="mt-7 text-xs uppercase tracking-[0.25em] text-[#52647b]">your order is on its way</p><h1 className="mt-3 font-display text-4xl">{bi("طلبك اتسجل بنجاح", "Your order was placed successfully", language)}</h1><p className="mt-5 leading-8 text-[#657286]">{bi(`شكرًا ${form.customerName}. هنتواصل معاك على رقم `, `Thank you ${form.customerName}. We will contact you at `, language)}<span className="font-semibold text-[#0c1017]">{form.phone}</span> {bi("لتأكيد الطلب.", "to confirm your order.", language)}</p><div className="mt-7 rounded-2xl bg-[#e9edf3] p-5 text-sm"><div className="flex justify-between"><span className="text-[#657286]">{bi("رقم الطلب", "Order number", language)}</span><strong>{submittedOrder.orderNumber}</strong></div><div className="mt-3 flex justify-between"><span className="text-[#657286]">{bi("الإجمالي عند الاستلام", "Total on delivery", language)}</span><strong className="text-[#52647b]">{money(submittedOrder.total)}</strong></div></div><div className="mt-4 rounded-2xl border border-[#d9dee6] bg-white/60 p-4 text-right text-sm"><p className="font-semibold">{bi("تفاصيل طلبك", "Order details", language)}</p>{submittedOrder.items.map((item) => <div key={item.id} className="mt-2 flex justify-between gap-3 text-[#657286]"><span>{item.name} · {bi("قطعة واحدة", "One piece", language)}</span><span>{money(item.price)}</span></div>)}<div className="mt-3 border-t border-[#d9dee6] pt-3 text-[#657286]"><span>{bi("عنوان الاستلام", "Delivery address", language)}: </span>{submittedOrder.address}</div></div><div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center"><a href={waUrl} target="_blank" rel="noreferrer" className="no-print inline-flex items-center justify-center gap-2 rounded-full bg-[#25d366] px-5 py-3.5 text-sm font-medium text-white shadow-md shadow-[#25d366]/20 transition hover:bg-[#1ebd59]"><MessageCircle size={16} />{bi("تأكيد فوري عبر واتساب", "Instant WhatsApp confirmation", language)}</a><button type="button" onClick={() => window.print()} className="no-print inline-flex items-center justify-center gap-2 rounded-full border border-[#b9c4d2] bg-[#ffffff] px-5 py-3.5 text-sm text-[#263448] transition hover:border-[#0c1017] hover:bg-white"><Printer size={16} />{bi("طباعة / حفظ PDF", "Print / Save PDF", language)}</button></div><Link href="/" className="no-print mt-4 inline-flex items-center gap-2 rounded-full bg-[#0c1017] px-6 py-3.5 text-sm text-white transition hover:bg-[#1c2736]">{bi("العودة للمجموعة", "Back to collection", language)} {isArabic ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}</Link></div></main></div>;
  }

  if (items.length === 0) {
    return <div dir={isArabic ? "rtl" : "ltr"} className="min-h-screen bg-[#f5f6f8] text-[#0c1017]"><StoreHeader /><main className="container flex min-h-[70vh] items-center justify-center py-20"><div className="text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e0e5ec] text-[#52647b]"><Minus size={25} /></div><h1 className="mt-6 font-display text-4xl">{bi("السلة فاضية", "Your cart is empty", language)}</h1><p className="mt-3 text-[#657286]">{bi("لسه مفيش برفانات اخترتها. ارجع للمجموعة واختار أثرك.", "You have not chosen a perfume yet. Return to the collection and choose your signature.", language)}</p><Link href="/#collection" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#0c1017] px-6 py-3.5 text-sm text-white transition hover:bg-[#1c2736]">{bi("تصفح المجموعة", "Browse collection", language)} {isArabic ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}</Link></div></main></div>;
  }

  const grandTotal = total + SHIPPING_FEE;
  const updateField = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const submitOrder = (event: React.FormEvent) => {
    event.preventDefault();
    createOrder.mutate({ ...form, shippingFee: SHIPPING_FEE, items: items.map((item) => ({ productId: item.id, reservationToken: item.reservationToken })) });
  };

  const removeReservedItem = (item: (typeof items)[number]) => {
    void releaseReservation.mutateAsync({ productId: item.id, reservationToken: item.reservationToken });
    removeItem(item.id);
  };

  const clearReservedItems = () => {
    for (const item of items) void releaseReservation.mutateAsync({ productId: item.id, reservationToken: item.reservationToken });
    clear();
  };

  return <div dir={isArabic ? "rtl" : "ltr"} className="min-h-screen bg-[#f5f6f8] text-[#0c1017]"><StoreHeader /><main className="container py-12 sm:py-16"><div className="mb-6 flex items-center justify-between rounded-2xl border border-[#e0c8b7] bg-[#fff5eb] px-4 py-3 text-sm text-[#765849]"><span className="flex items-center gap-2"><Clock3 size={17} />{bi("الوقت المتبقي للحجز", "Reservation time remaining", language)}</span><strong className="font-mono text-lg tracking-wider text-[#52647b]">{countdown}</strong></div><div className="mb-10 flex items-end justify-between gap-4"><div><Link href="/" className="mb-4 inline-flex items-center gap-2 text-xs text-[#7d8898] transition hover:text-[#0c1017]">{isArabic ? <ArrowRight size={14} /> : <ArrowLeft size={14} />} {bi("رجوع للمجموعة", "Back to collection", language)}</Link><h1 className="font-display text-4xl sm:text-5xl">{bi("سلتك المختارة", "Your selection", language)}</h1></div><span className="text-sm text-[#7d8898]">{items.length} {items.length === 1 ? bi("قطعة", "item", language) : bi("قطع", "items", language)}</span></div><div className="grid gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-start"><section className="rounded-[28px] border border-[#d9dee6] bg-white/55 p-5 sm:p-7"><div className="mb-6 flex items-center justify-between border-b border-[#d9dee6] pb-5"><h2 className="font-display text-xl">{bi("المنتجات", "Products", language)}</h2><button onClick={clearReservedItems} className="text-xs text-[#52647b] transition hover:text-[#0c1017]">{bi("إفراغ السلة", "Clear cart", language)}</button></div><div className="space-y-5">{items.map((item) => <div key={item.id} className="flex gap-4"><div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl"><PerfumeImage src={item.imageUrl} name={item.name} compact /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><h3 className="font-display text-lg">{item.name}</h3><p className="mt-1 text-xs text-[#7d8898]">{item.size || "Eau de parfum"} · {bi("قطعة واحدة", "One piece", language)}</p></div><button onClick={() => removeReservedItem(item)} aria-label={`حذف ${item.name}`} className="text-[#b99b8b] transition hover:text-[#52647b]"><Trash2 size={16} /></button></div><div className="mt-5 text-sm font-semibold text-[#52647b]">{money(item.price)}</div></div></div>)}</div></section><section className="rounded-[28px] border border-[#d9dee6] bg-[#e9edf3] p-5 sm:p-7"><div className="mb-6"><p className="text-xs uppercase tracking-[0.25em] text-[#52647b]">checkout</p><h2 className="mt-2 font-display text-2xl">{bi("بيانات الاستلام", "Delivery details", language)}</h2></div><form onSubmit={submitOrder} className="space-y-4"><Field label={bi("الاسم بالكامل", "Full name", language)} value={form.customerName} onChange={(value) => updateField("customerName", value)} placeholder={bi("مثال: سارة أحمد", "e.g. Sara Ahmed", language)} required /><Field label={bi("رقم الموبايل", "Mobile number", language)} value={form.phone} onChange={(value) => updateField("phone", value)} placeholder="01xxxxxxxxx" type="tel" required /><div className="grid gap-4 sm:grid-cols-2"><Field label={bi("المحافظة", "Governorate", language)} value={form.governorate} onChange={(value) => updateField("governorate", value)} placeholder={bi("القاهرة", "Cairo", language)} required /><Field label={bi("المنطقة", "Area", language)} value={form.area} onChange={(value) => updateField("area", value)} placeholder={bi("مدينة نصر", "Nasr City", language)} required /></div><label className="block"><span className="mb-2 block text-xs text-[#657286]">{bi("العنوان بالتفصيل", "Full address", language)}</span><textarea required minLength={5} value={form.address} onChange={(event) => updateField("address", event.target.value)} placeholder={bi("الشارع، العمارة، الدور، الشقة", "Street, building, floor, apartment", language)} className="min-h-24 w-full resize-none rounded-2xl border border-[#cad3df] bg-[#ffffff]/75 px-4 py-3 text-sm outline-none transition placeholder:text-[#9aa6b6] focus:border-[#52647b]" /></label><label className="block"><span className="mb-2 block text-xs text-[#657286]">{bi("ملاحظات (اختياري)", "Notes (optional)", language)}</span><textarea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} placeholder={bi("علامة مميزة أو وقت مناسب للتوصيل", "Landmark or preferred delivery time", language)} className="min-h-20 w-full resize-none rounded-2xl border border-[#cad3df] bg-[#ffffff]/75 px-4 py-3 text-sm outline-none transition placeholder:text-[#9aa6b6] focus:border-[#52647b]" /></label><div className="mt-6 rounded-2xl border border-[#d8c1b0] bg-[#ffffff]/65 p-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0c1017] text-[#ffffff]"><Truck size={16} /></div><div><p className="text-sm font-medium">{bi("الدفع نقدًا عند الاستلام", "Cash on delivery", language)}</p><p className="mt-1 text-xs text-[#7d8898]">{bi("هنأكد معاك الطلب قبل الشحن", "We will confirm your order before shipping", language)}</p></div></div></div><div className="mt-5 space-y-3 border-t border-[#cad3df] pt-5 text-sm"><div className="flex justify-between text-[#657286]"><span>{bi("المنتجات", "Products", language)}</span><span>{money(total)}</span></div><div className="flex justify-between text-[#657286]"><span>{bi("الشحن", "Shipping", language)}</span><span>{money(SHIPPING_FEE)}</span></div><div className="flex justify-between pt-2 text-base font-semibold"><span>{bi("الإجمالي عند الاستلام", "Total on delivery", language)}</span><span className="text-[#52647b]">{money(grandTotal)}</span></div></div><button type="submit" disabled={createOrder.isPending} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#0c1017] py-4 text-sm font-medium text-white shadow-xl shadow-[#0c1017]/15 transition hover:bg-[#1c2736] disabled:cursor-wait disabled:opacity-70">{createOrder.isPending ? <Loader2 className="animate-spin" size={17} /> : <ShieldCheck size={17} />} {bi("تأكيد الطلب", "Confirm order", language)}</button><p className="mt-4 text-center text-[11px] leading-5 text-[#7d8898]">{bi("بالضغط على تأكيد الطلب، هنسجل بيانات الاستلام ونتواصل معاك لتأكيده.", "By confirming, we will save your delivery details and contact you to confirm the order.", language)}</p></form></section></div></main></div>;
}

function Field({ label, value, onChange, placeholder, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; required?: boolean }) {
  return <label className="block"><span className="mb-2 block text-xs text-[#657286]">{label}</span><input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-12 w-full rounded-2xl border border-[#cad3df] bg-[#ffffff]/75 px-4 text-sm outline-none transition placeholder:text-[#9aa6b6] focus:border-[#52647b]" /></label>;
}
