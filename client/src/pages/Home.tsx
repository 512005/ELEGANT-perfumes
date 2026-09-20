import { useState } from "react";
import { Link } from "wouter";
import { ArrowDown, ArrowLeft, ArrowRight, Check, Heart, Loader2, Plus, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { toast } from "sonner";
import StoreHeader from "@/components/StoreHeader";
import PerfumeImage from "@/components/PerfumeImage";
import { useCart } from "@/contexts/CartContext";
import { useLanguage, bi } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";

const money = (value: number) => `${new Intl.NumberFormat("en-US").format(value)} EGP`;

export default function Home() {
  const { addItem, items } = useCart();
  const { language, isArabic } = useLanguage();
  const productsQuery = trpc.products.list.useQuery();
  const reserveProduct = trpc.products.reserve.useMutation({
    onError: (error) => { toast.error(error.message); void productsQuery.refetch(); },
  });
  const products = productsQuery.data ?? [];
  const [activeId, setActiveId] = useState<number | null>(null);
  const addProduct = (product: (typeof products)[number]) => {
    if (reserveProduct.isPending) return;
    setActiveId(product.id);
    reserveProduct.mutate({ productId: product.id }, {
      onSuccess: (reservation) => {
        const added = addItem({ id: reservation.id, name: reservation.name, price: reservation.price, imageUrl: reservation.imageUrl, size: reservation.size, reservationToken: reservation.reservationToken, reservationExpiresAt: new Date(reservation.reservationExpiresAt).getTime() });
        void productsQuery.refetch();
        window.setTimeout(() => setActiveId(null), 450);
        if (added) toast.success(bi("اتضاف للسلة واتحجز لمدة 15 دقيقة", "Added and reserved for 15 minutes", language), { description: product.name });
      },
    });
  };

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="min-h-screen bg-[#f5f6f8] text-[#0c1017]">
      <StoreHeader />
      <main>
        <section className="relative overflow-hidden border-b border-[#d9dee6]">
          <div className="absolute -left-20 top-14 h-72 w-72 rounded-full bg-[#d9b29a]/20 blur-3xl" />
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#e8d4c1]/35 blur-3xl" />
          <div className="container relative grid min-h-[640px] items-center gap-12 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:py-24">
            <div className="order-2 max-w-xl lg:order-1">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#d9c4b4] bg-white/55 px-4 py-2 text-xs text-[#52647b]">
                <Sparkles size={13} />
                {bi("كل زجاجة لها حكاية مختلفة", "Every bottle tells a different story", language)}
              </div>
              <h1 className="font-display text-5xl leading-[1.15] tracking-[-0.045em] text-[#0c1017] sm:text-6xl lg:text-7xl">
                {bi("عطر يسيب", "A scent that leaves", language)}<br /><span className="text-[#52647b] italic">{bi("أثرًا", "an impression", language)}</span> {bi("مش شبه حد.", "unlike any other.", language)}
              </h1>
              <p className="mt-7 max-w-md text-base leading-8 text-[#657286]">{bi("اختار رائحتك من قطعنا المختارة بعناية. كل برفان قطعة واحدة فقط، لحد ما يلاقي صاحبه المناسب.", "Choose your scent from our carefully selected one-of-one pieces. Each perfume exists only once, until it finds its person.", language)}</p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <a href="#collection" className="group inline-flex items-center gap-3 rounded-full bg-[#0c1017] px-6 py-3.5 text-sm font-medium text-[#ffffff] shadow-xl shadow-[#0c1017]/15 transition-all duration-200 hover:-translate-y-1 hover:bg-[#1c2736]">{bi("استكشف المجموعة", "Explore the collection", language)} <ArrowDown size={16} className="transition-transform group-hover:translate-y-0.5" /></a>
                <Link href="/cart" className="inline-flex items-center gap-2 px-4 py-3.5 text-sm text-[#657286] transition-colors hover:text-[#0c1017]">{bi("اذهب للسلة", "Go to cart", language)} {isArabic ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}</Link>
              </div>
              <div className="mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-[#c9d1dc] pt-6 text-[11px] text-[#7d8898]">
                <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#52647b]" />{bi("اختيارات أصلية", "Curated picks", language)}</span>
                <span className="flex items-center gap-2"><Truck size={16} className="text-[#52647b]" />{bi("دفع عند الاستلام", "Cash on delivery", language)}</span>
                <span className="flex items-center gap-2"><Heart size={15} className="text-[#52647b]" />{bi("تغليف بحب", "Wrapped with care", language)}</span>
              </div>
            </div>
            {/* ── Perfume Bottle ── */}
            <div className="order-1 flex min-h-[440px] items-center justify-center lg:order-2">
              <div className="relative flex flex-col items-center">

                {/* Floating badge */}
                <div className="absolute -left-6 top-6 z-20 rounded-full border border-white/70 bg-white/70 px-4 py-1.5 text-[10px] tracking-[0.26em] text-[#52647b] shadow-sm backdrop-blur-sm">
                  NO. 01 / RARE BLEND
                </div>

                {/* Ambient glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-56 rounded-full bg-[#7e9bb5]/25 blur-3xl" />

                {/* Bottle wrapper */}
                <div className="relative z-10 flex flex-col items-center" style={{ filter: "drop-shadow(0 28px 40px rgba(12,16,23,0.35))" }}>



                  {/* Cap */}
                  <div className="h-14 w-28 rounded-t-[8px] rounded-b-[2px]"
                    style={{
                      background: "linear-gradient(160deg,#b9c4d2 0%,#8a96a8 30%,#c8d2de 55%,#6e7f92 80%,#9aaabb 100%)",
                      boxShadow: "inset 0 2px 4px rgba(255,255,255,0.4),inset 0 -2px 4px rgba(0,0,0,0.2)"
                    }}
                  />

                  {/* Neck */}
                  <div className="h-6 w-16"
                    style={{ background: "linear-gradient(to right,#3d4f62 0%,#6b7f94 20%,#c2cdd8 45%,#dce5ee 55%,#c2cdd8 65%,#6b7f94 80%,#3d4f62 100%)" }}
                  />

                  {/* Shoulders */}
                  <div className="h-5 w-44"
                    style={{
                      background: "linear-gradient(to right,#2c3d4f 0%,#4a5f74 20%,#8fa0b2 40%,#b8c7d6 55%,#8fa0b2 70%,#4a5f74 85%,#2c3d4f 100%)",
                      clipPath: "polygon(18% 0%,82% 0%,100% 100%,0% 100%)"
                    }}
                  />

                  {/* Body */}
                  <div className="relative h-64 w-44 overflow-hidden sm:h-72"
                    style={{
                      background: "linear-gradient(to right,#1e2d3d 0%,#2e4055 12%,#4a6075 22%,#5d7590 32%,#6b8499 42%,#738da3 50%,#6b8499 58%,#5d7590 68%,#4a6075 78%,#2e4055 88%,#1e2d3d 100%)",
                      borderRadius: "2px 2px 10px 10px",
                      boxShadow: "inset 0 0 40px rgba(0,0,0,0.25)"
                    }}
                  >
                    {/* Left specular highlight */}
                    <div className="absolute inset-y-0 left-4 w-6 opacity-25"
                      style={{ background: "linear-gradient(to right,transparent,rgba(220,235,248,0.9),transparent)" }}
                    />
                    {/* Right highlight */}
                    <div className="absolute inset-y-0 right-5 w-3 opacity-15"
                      style={{ background: "linear-gradient(to right,transparent,rgba(220,235,248,0.7),transparent)" }}
                    />

                    {/* Label */}
                    <div className="absolute inset-x-5 top-10 bottom-10 flex flex-col items-center justify-center rounded-sm border border-white/20"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      <Sparkles size={14} className="mb-3 text-white/60" />
                      <div className="font-display text-lg tracking-[0.22em] text-white/90">Elegant</div>
                      <div className="mt-1.5 text-[7.5px] uppercase tracking-[0.38em] text-white/55">fine fragrance</div>
                      <div className="mt-5 h-px w-10 bg-white/25" />
                      <div className="mt-3 text-[7px] uppercase tracking-[0.18em] text-white/40">eau de parfum</div>
                    </div>
                  </div>

                  {/* Base */}
                  <div className="h-4 w-48 rounded-b-xl"
                    style={{
                      background: "linear-gradient(to right,#1a2838 0%,#2e4055 25%,#4a6075 50%,#2e4055 75%,#1a2838 100%)",
                      boxShadow: "0 6px 18px rgba(0,0,0,0.4)"
                    }}
                  />
                </div>

                {/* Floor shadow */}
                <div className="mt-3 h-5 w-32 rounded-full bg-black/20 blur-md" />

                {/* Floating scent badge — lower on the bottle */}
                <div className="absolute top-64 -right-10 z-20 h-24 w-24 rounded-full border border-[#c5ccd7]/70 bg-[#edf0f4]/70 backdrop-blur-sm flex items-center justify-center p-3 text-center text-[10px] leading-5 text-[#657286]">
                  {bi("مزيج دافئ من الورد والعنبر", "Warm blend of rose & amber", language)}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="collection" className="container py-24">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[#52647b]">the edit</p>
              <h2 className="font-display text-4xl tracking-[-0.04em]">{bi("اختار أثرك", "Choose your signature", language)}</h2>
            </div>
            <p className="max-w-xs text-sm leading-7 text-[#657286]">{bi("قطع محدودة، منتقاة بذوق هادئ. لا يوجد تكرار، ولا فرصة ثانية لنفس الزجاجة.", "Limited pieces, selected with a quiet eye. No repeats, and no second chance for the same bottle.", language)}</p>
          </div>
          {productsQuery.isLoading ? (
            <div className="flex min-h-72 items-center justify-center text-[#7d8898]"><Loader2 className="animate-spin" /></div>
          ) : products.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-[#c7d0db] bg-white/45 px-6 py-20 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#e0e5ec] text-[#52647b]"><Sparkles size={22} /></div>
              <h3 className="font-display text-2xl">{bi("المجموعة بتتجهز", "The collection is being prepared", language)}</h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#657286]">{bi("أضف أول منتجاتك من لوحة الإدارة، وهتظهر هنا تلقائيًا للعملاء.", "Add your first products from the brand studio and they will appear here automatically.", language)}</p>
              <Link href="/admin" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#0c1017] px-5 py-3 text-sm text-white transition hover:bg-[#1c2736]">{bi("فتح لوحة الإدارة", "Open brand studio", language)} {isArabic ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}</Link>
            </div>
          ) : (
            <div className="space-y-16">
              {([{ audience: "men" as const, title: bi("البرفانات الرجالي", "Men's perfumes", language) }, { audience: "women" as const, title: bi("البرفانات الحريمي", "Women's perfumes", language) }]).map((section) => {
                const sectionProducts = products.filter((product) => product.audience === section.audience);
                return <section key={section.audience} aria-labelledby={`${section.audience}-perfumes`}><div className="mb-6 flex items-center gap-4"><span className="h-px flex-1 bg-[#d9dee6]" /><h3 id={`${section.audience}-perfumes`} className="font-display text-3xl text-[#0c1017]">{section.title}</h3><span className="h-px flex-1 bg-[#d9dee6]" /></div>{sectionProducts.length === 0 ? <div className="rounded-[22px] border border-dashed border-[#c7d0db] bg-white/30 px-5 py-10 text-center text-sm text-[#7d8898]">{bi("لسه مفيش برفانات في القسم ده.", "No perfumes in this section yet.", language)}</div> : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{sectionProducts.map((product, index) => { const inCart = items.some((item) => item.id === product.id); return <article key={product.id} className="group overflow-hidden rounded-[26px] border border-[#d9dee6] bg-white/60 transition-all duration-300 hover:-translate-y-1 hover:border-[#cfb3a0] hover:shadow-2xl hover:shadow-[#6d4b49]/10"><div className="relative aspect-[0.95] overflow-hidden"><PerfumeImage src={product.imageUrl} name={product.name} /><span className="absolute right-4 top-4 rounded-full bg-[#ffffff]/85 px-3 py-1.5 text-[10px] text-[#657286] backdrop-blur">{bi("قطعة واحدة", "One piece", language)}</span><span className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#ffffff]/75 text-xs text-[#63758d] backdrop-blur">0{index + 1}</span></div><div className="p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-display text-xl">{product.name}</h3><p className="mt-1 text-xs text-[#7d8898]">{product.size || "Eau de parfum"}</p></div><span className="whitespace-nowrap text-sm font-semibold text-[#52647b]">{money(product.price)}</span></div>{product.description && <p className="mt-4 line-clamp-2 text-sm leading-6 text-[#657286]">{product.description}</p>}<button onClick={() => addProduct(product)} disabled={inCart} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-[#b9c4d2] bg-[#ffffff] py-3 text-sm text-[#263448] transition-all duration-200 hover:border-[#0c1017] hover:bg-[#0c1017] hover:text-white disabled:cursor-default disabled:border-[#c7d0db] disabled:bg-[#e4e8ee] disabled:text-[#7f8a9a]">{activeId === product.id ? <Check size={16} /> : inCart ? <Check size={16} /> : <Plus size={17} />}{inCart ? bi("اتضافت للسلة", "Added to cart", language) : bi("أضف للسلة", "Add to cart", language)}</button></div></article>; })}</div>}</section>;
              })}
            </div>
          )}
        </section>

        <section id="story" className="border-y border-[#d9dee6] bg-[#e9edf3]">
          <div className="container grid gap-10 py-20 md:grid-cols-[0.85fr_1.15fr] md:items-center">
            <div>
              <p className="mb-4 text-xs uppercase tracking-[0.3em] text-[#52647b]">our point of view</p>
              <h2 className="font-display text-4xl leading-tight">{bi("الهدوء له", "Quiet has a", language)}<br /><span className="italic text-[#52647b]">{bi("رائحة.", "scent.", language)}</span></h2>
            </div>
            <div className="max-w-2xl text-[#657286]">
              <p className="text-lg leading-9">{bi("في Elegant، بنؤمن إن العطر مش مجرد ريحة حلوة. هو تفصيلة صغيرة بتكمّل حضورك، وذكرى بتفضل موجودة حتى بعد ما تمشي.", "At Elegant, we believe perfume is more than a beautiful smell. It is a small detail that completes your presence, and a memory that lingers after you leave.", language)}</p>
              <p className="mt-5 text-sm leading-8">{bi("عشان كده بنختار كل زجاجة كأنها رسالة، ونقدمها قطعة واحدة فقط. كفاية إنها تكون شبهك.", "That is why we choose every bottle like a message, offering it as a one-of-one piece. Enough to feel like you.", language)}</p>
            </div>
          </div>
        </section>

        <section id="care" className="container grid gap-6 py-20 sm:grid-cols-3">
          {[
            ["01", bi("قطعة واحدة", "One piece", language), bi("كل منتج معروض متاح منه زجاجة واحدة فقط، عشان يفضل اختيارك الخاص.", "Each product is available as a single bottle, so it always feels like your own choice.", language)],
            ["02", bi("دفع عند الاستلام", "Cash on delivery", language), bi("اطلب براحة، وإحنا نتواصل معاك لتأكيد الطلب قبل الشحن.", "Order with ease, and we will contact you to confirm before shipping.", language)],
            ["03", bi("تغليف يُحكى عنه", "Wrapped with care", language), bi("كل طلب بيتجهز بعناية عشان لحظة الوصول تكون جزء من التجربة.", "Every order is prepared with care, so arrival becomes part of the experience.", language)],
          ].map(([number, title, text]) => <div key={number} className="rounded-[22px] border border-[#d9dee6] bg-white/40 p-6"><span className="text-xs tracking-[0.2em] text-[#7d8da3]">{number}</span><h3 className="mt-5 font-display text-xl">{title}</h3><p className="mt-3 text-sm leading-7 text-[#657286]">{text}</p></div>)}
        </section>
      </main>
      <footer className="border-t border-[#d9dee6] py-8"><div className="container flex flex-col items-center justify-between gap-3 text-xs text-[#7d8898] sm:flex-row"><span>© 2026 Elegant — fine fragrance</span><Link href="/admin" className="transition-colors hover:text-[#0c1017]">{bi("إدارة المتجر", "Store Management", language)}</Link></div></footer>
    </div>
  );
}
