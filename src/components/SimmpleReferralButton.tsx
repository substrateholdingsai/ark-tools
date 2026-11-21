import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/cn';

const SIMMPLE_REFERRAL_URL = 'https://app2.simmple.mx/register?ref=PAVE8BZP';

interface SimmpleReferralButtonProps {
  className?: string;
  prefixText?: string;
  compact?: boolean;
}

export function SimmpleReferralButton({
  className,
  prefixText = '¿Buscas contabilidad PyME?',
  compact = false,
}: SimmpleReferralButtonProps) {
  return (
    <a
      href={SIMMPLE_REFERRAL_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'shadow-xs backdrop-blur-xs border-slate-200/90 text-slate-700 hover:text-slate-900 group inline-flex items-center gap-1.5 rounded-full border bg-white/95 px-3 py-1.5 text-[11px] font-medium transition-all hover:border-[#9ec844] hover:bg-white hover:shadow-sm',
        className
      )}
      title="¿Buscas contabilidad para tu negocio o PyME? Conoce SIMMPLE"
    >
      {!compact && prefixText && (
        <span className="text-slate-500 group-hover:text-slate-700 hidden transition-colors sm:inline">
          {prefixText}
        </span>
      )}
      <span className="inline-flex items-center font-sans text-[11.5px] font-extrabold tracking-tight">
        <span className="text-[#33475b]">SI</span>
        <span className="text-[#9ec844]">MM</span>
        <span className="text-[#33475b]">PL</span>
        <span className="text-[1.15em] font-black leading-none text-[#9ec844]">Σ</span>
        <sup className="-top-1 ml-0.5 text-[7.5px] font-semibold text-[#33475b]/70">®</sup>
      </span>
      <ArrowUpRight
        size={12}
        className="text-[#9ec844] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </a>
  );
}

export default SimmpleReferralButton;
