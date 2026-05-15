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
      <p className="text-[15px] text-gray-900 mt-1.5">AEO Visibility Check</p>
    </div>
  );
}
