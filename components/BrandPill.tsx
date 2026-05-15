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

      {/* Centre — text truly centred in remaining space */}
      <div className="flex-1 flex justify-center">
        <p
          className="text-2xl text-gray-900 font-light tracking-widest"
          style={{ fontFamily: 'var(--font-exo2)' }}
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
