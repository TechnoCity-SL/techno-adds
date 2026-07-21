import Image from "next/image";

export function Logo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <Image
      src="/logo-full.png"
      alt="TechnoAds"
      width={786}
      height={254}
      priority
      className={className}
    />
  );
}
