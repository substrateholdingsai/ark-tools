import { cn } from '@/lib/cn';

const SIMMPLE_REFERRAL_URL = 'https://app2.simmple.mx/register?ref=PAVE8BZP';

interface SimmpleReferralButtonProps {
  className?: string;
  label?: string;
}

export function SimmpleReferralButton({
  className,
  label = 'Programa de Referidos SIMMPLE',
}: SimmpleReferralButtonProps) {
  return (
    <a
      href={SIMMPLE_REFERRAL_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-[#b5d865]/40 bg-[#3e4d5c] px-3 py-1.5 text-[11px] font-semibold text-[#b5d865] transition hover:bg-[#3e4d5c]/90',
        className
      )}
      title="Programa de referidos SIMMPLE"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 800 180"
        width="96"
        height="22"
        aria-hidden="true"
      >
        <rect width="100%" height="100%" fill="#3e4d5c" />
        <style>{`
          .letra { fill: #b5d865; stroke: #b5d865; strokeWidth: 2; stroke-linecap: round; strokeLinejoin: round; }
          .simbodo { fill: none; stroke: #b5d865; strokeWidth: 12; stroke-linecap: round; strokeLinejoin: round; }
        `}</style>
        <g transform="translate(50, 50)">
          <path
            className="letra"
            d="M 45,25 C 45,10 20,10 20,30 C 20,50 55,45 55,65 C 55,85 25,85 20,75"
            fill="none"
            strokeWidth="14"
          />
          <line className="letra" x1="85" y1="20" x2="85" y2="80" strokeWidth="14" />
          <path
            className="letra"
            d="M 115,80 L 115,25 L 145,60 L 175,25 L 175,80"
            fill="none"
            strokeWidth="14"
            strokeLinejoin="round"
          />
          <path
            className="letra"
            d="M 210,80 L 210,25 L 240,60 L 270,25 L 270,80"
            fill="none"
            strokeWidth="14"
            strokeLinejoin="round"
          />
          <path
            className="letra"
            d="M 305,80 L 305,20 L 335,20 C 360,20 360,50 335,50 L 305,50"
            fill="none"
            strokeWidth="14"
            strokeLinejoin="round"
          />
          <path
            className="letra"
            d="M 395,20 L 395,80 L 435,80"
            fill="none"
            strokeWidth="14"
            strokeLinejoin="round"
          />
          <path className="simbodo" d="M 475,25 L 530,25 L 485,75 L 535,75" />
          <circle cx="550" cy="20" r="3" fill="#b5d865" />
        </g>
      </svg>
      <span className="hidden sm:inline">{label}</span>
    </a>
  );
}

export default SimmpleReferralButton;
