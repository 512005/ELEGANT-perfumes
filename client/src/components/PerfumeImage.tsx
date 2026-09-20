import { Droplets, Sparkles } from "lucide-react";

export default function PerfumeImage({ src, name, compact = false }: { src?: string | null; name: string; compact?: boolean }) {
  if (src) {
    return <img src={src} alt={name} className={`h-full w-full object-cover ${compact ? "rounded-xl" : ""}`} />;
  }
  return (
    <div className={`relative flex h-full min-h-[220px] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_25%_20%,#f4d9c0_0%,transparent_35%),linear-gradient(135deg,#ead8ca_0%,#bd9074_48%,#6d4b49_100%)] ${compact ? "rounded-xl" : ""}`}>
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(#fff_0.7px,transparent_0.7px)] [background-size:16px_16px]" />
      <div className="relative flex flex-col items-center">
        <div className="mb-1 h-4 w-12 rounded-t-sm bg-[#d6b18f] shadow-lg" />
        <div className="relative flex h-36 w-24 items-center justify-center rounded-[24px_24px_18px_18px] border border-white/35 bg-[#e7bd93]/60 shadow-[0_20px_30px_rgba(46,24,27,0.28)] backdrop-blur-sm">
          <div className="absolute inset-x-4 top-8 rounded-sm border border-[#fff]/45 py-3 text-center text-[#fff7ee]">
            <Sparkles size={13} className="mx-auto mb-2 opacity-90" />
            <span className="block text-[8px] font-medium tracking-[0.2em]">Elegant</span>
            <span className="mt-1 block text-[7px] uppercase tracking-[0.15em] opacity-80">eau de parfum</span>
          </div>
        </div>
        <Droplets className="absolute -bottom-9 text-white/50" size={20} />
      </div>
    </div>
  );
}
