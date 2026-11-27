import Image from "next/image";

export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/tanyara-logo-solid.png"
      alt=""
      width={784}
      height={200}
      className={className}
      unoptimized
    />
  );
}
