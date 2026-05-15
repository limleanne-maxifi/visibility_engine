import Image from 'next/image';

export default function BrandPill() {
  return (
    <div className="flex items-center gap-[50px] w-full">
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

      {/* Centre — text truly centred in remaining space */}
      <div className="flex-1 flex justify-center min-w-0">
        <p
          className="text-2xl whitespace-nowrap"
          style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 300, whiteSpace: 'nowrap', color: '#1a2744', letterSpacing: '0.05em' }}
        >
          AEO Visibility Check
        </p>
      </div>

      {/* Spacer — mirrors logo div width to balance layout */}
      <div className="flex-none invisible" aria-hidden="true">
        <Image
          src="/maxifi-logo-black.png"
          alt=""
          height={53}
          width={265}
          className="h-[53px] w-auto"
        />
      </div>
    </div>
  );
}
