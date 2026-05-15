import Image from 'next/image';

export default function BrandPill() {
  return (
    <div className="relative flex items-center w-full">
      <Image
        src="/maxifi-logo-black.png"
        alt="Maxifi Digital"
        height={53}
        width={265}
        className="h-[53px] w-auto"
      />
      <p
        className="absolute left-1/2 -translate-x-1/2 text-2xl text-gray-900 font-light tracking-widest"
        style={{ fontFamily: 'var(--font-exo2)' }}
      >
        AEO Visibility Check
      </p>
    </div>
  );
}
