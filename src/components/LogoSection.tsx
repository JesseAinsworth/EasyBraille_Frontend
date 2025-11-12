import Link from "next/link"

interface LogoSectionProps {
  size?: "small" | "medium" | "large" | "xlarge"
  showText?: boolean
  src?: string
  alt?: string
  srcSet?: string
}

export function LogoSection({ size = "medium", showText = true, src, alt, srcSet }: LogoSectionProps) {
  // Determinar el tamaño del logo basado en el prop
  const dimensions = {
    small: { width: 32, height: 32 },
    medium: { width: 48, height: 48 },
    large: { width: 96, height: 96 },
    xlarge: { width: 192, height: 192 },
  }

  const { width, height } = dimensions[size]

  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="relative" style={{ width, height }}>
        <img
          src={src ?? "/images/easybraillenegro.png"}
          srcSet={srcSet}
          alt={alt ?? "EasyBraille Logo"}
          className="h-full w-auto object-contain rounded"
          width={width}
          height={height}
        />
      </div>
      {showText && <span className="text-xl font-bold">EasyBraille</span>}
    </Link>
  )
}
