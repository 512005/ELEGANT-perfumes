import { Link } from "wouter";
import { ArrowLeft, ArrowRight, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage, bi } from "@/contexts/LanguageContext";

export default function StoreHeader() {
  const { count } = useCart();
  const { language, isArabic, toggleLanguage } = useLanguage();
  return (
    <header className="sticky top-0 z-40 border-b border-[#d9dee6]/80 bg-[#f5f6f8]/90 backdrop-blur-xl">
      <div className="container flex h-20 items-center justify-between">
        <Link href="/" className="group flex items-center gap-3" aria-label={bi("العودة للرئيسية", "Back home", language)}>
          <span className="flex h-11 w-11 overflow-hidden rounded-full bg-[#0c1017] shadow-lg shadow-[#0c1017]/15 transition-transform duration-200 group-hover:-rotate-6 border border-[#232c3b]">
            <img src="/elegant-logo-square.png" alt="Elegant" className="h-full w-full object-cover object-center" />
          </span>
          <span className="leading-none">
            <span className="block font-display text-xl tracking-[0.12em] text-[#0c1017]">Elegant</span>
            <span className="mt-1 block text-[9px] uppercase tracking-[0.32em] text-[#7e8b9e]">fine fragrance</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-[#657286] md:flex">
          <a href="/#collection" className="transition-colors hover:text-[#0c1017]">{bi("المجموعة", "Collection", language)}</a>
          <a href="/#story" className="transition-colors hover:text-[#0c1017]">{bi("حكايتنا", "Our story", language)}</a>
          <a href="/#care" className="transition-colors hover:text-[#0c1017]">{bi("التفاصيل", "Details", language)}</a>
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={toggleLanguage} className="rounded-full border border-[#c9d1dc] bg-white/60 px-3 py-2 text-[11px] font-semibold tracking-[0.12em] text-[#657286] transition hover:border-[#0c1017] hover:text-[#0c1017]" aria-label={bi("تغيير اللغة إلى الإنجليزية", "Switch language to Arabic", language)}>{isArabic ? "EN" : "ع"}</button>
          <Link href="/cart" className="group relative flex items-center gap-2 rounded-full border border-[#c9d1dc] bg-white/60 px-4 py-2.5 text-sm text-[#0c1017] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0c1017] hover:bg-white">
            <ShoppingBag size={17} strokeWidth={1.6} />
            <span className="hidden sm:inline">{bi("السلة", "Cart", language)}</span>
            {count > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#63758d] px-1 text-[10px] font-bold text-white">{count}</span>}
            {isArabic ? (
              <ArrowLeft size={14} className="mr-0.5 transition-transform group-hover:-translate-x-0.5" />
            ) : (
              <ArrowRight size={14} className="ml-0.5 transition-transform group-hover:translate-x-0.5" />
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
