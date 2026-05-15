import Image from 'next/image';

export default function BrandPill() {
  return (
    <div>
      <Image
        src="/maxifi-logo-black.png"
        alt="Maxifi Digital"
        height={34}
        width={170}
        className="h-[34px] w-auto"
      />
      <p className="text-sm text-gray-700 mt-1.5">AEO Visibility Check</p>
    </div>
  );
}
