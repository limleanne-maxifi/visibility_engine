import Image from 'next/image';

export default function BrandPill() {
  return (
    <div className="flex items-center w-full">
      {/* Logo — flush left */}
      <div className="flex-none">
        <Image
          src="/maxifi-logo-black.png"
          alt="Maxifi Digital"
          height={53}
          width={265}
          className="h-[53px] w-auto"
        />
      </div>

      {/* Title — 50px from logo, centred in remaining space */}
      <div className="flex-1 flex justify-start min-w-0 pl-[16px]">
        <p
          className="text-2xl whitespace-nowrap"
          style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 700, whiteSpace: 'nowrap', color: '#1a2744', letterSpacing: '0.05em' }}
        >
          AI Visibility Snapshot
        </p>
      </div>
    </div>
  );
}
