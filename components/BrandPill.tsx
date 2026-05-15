import Image from 'next/image';

export default function BrandPill() {
  return (
    <div className="flex justify-center items-center gap-4 w-full">
      <Image
        src="/maxifi-logo-black.png"
        alt="Maxifi Digital"
        height={53}
        width={265}
        className="h-[53px] w-auto"
      />
      <p className="text-2xl text-gray-900">AEO Visibility Check</p>
    </div>
  );
}
