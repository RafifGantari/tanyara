import Image from "next/image";

export function Logo() {
  return (
    <span className="lp-logo">
      <Image src="/tanyara-logo-light.png" alt="" width={1040} height={256} unoptimized />
    </span>
  );
}
