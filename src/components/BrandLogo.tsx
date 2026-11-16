import Image from "next/image";

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  const size = compact ? 40 : 46;
  return (
    <span className={`brandMark${compact ? " compact" : ""}`}>
      <Image
        src="/brand/octopus-ia-icone-160.png"
        alt=""
        width={size}
        height={size}
        unoptimized
        priority={!compact}
        className="officialLogo"
      />
      <span className="brandWord">Octopus <b>IA</b></span>
    </span>
  );
}
