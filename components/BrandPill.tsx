import Image from 'next/image';

export default function BrandPill() {
  return (
    <div className="flex items-center justify-between w-full">
      <Image
        src="/maxifi-logo-black.png"
        alt="Maxifi Digital"
        height={53}
        width={265}
        className="h-[53px] w-auto"
      />
      <p className="text-xl font-semibold text-gray-900">AEO Visibility Check</p>
    </div>
  );
}
