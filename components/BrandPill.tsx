import Image from 'next/image';

export default function BrandPill() {
  return (
    <div>
      <Image
        src="/maxifi-logo-black.png"
        alt="Maxifi Digital"
        height={28}
        width={140}
        className="h-7 w-auto"
      />
      <p className="text-xs text-gray-400 mt-1.5">AEO Visibility Check</p>
    </div>
  );
}
