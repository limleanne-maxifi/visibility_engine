import Image from 'next/image';

export default function SiteHeader() {
  return (
    <header
      className="flex items-center justify-between px-8 h-14 border-b"
      style={{
        background: 'var(--navy-header)',
        borderColor: 'rgba(255,255,255,0.07)',
      }}
    >
      <a href="https://maxifidigital.com" className="flex items-center">
        <Image
          src="/maxifi-logo-white.png"
          alt="Maxifi Digital"
          height={22}
          width={110}
          className="h-[22px] w-auto"
          priority
        />
      </a>
      <a
        href="https://maxifidigital.com"
        className="text-[17px] font-bold tracking-tight transition-colors hover:text-white"
        style={{ color: 'rgba(255,255,255,0.75)' }}
      >
        ← maxifidigital.com
      </a>
    </header>
  );
}
