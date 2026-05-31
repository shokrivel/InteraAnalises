import logoSvg from '@/assets/InteraAnalisesLogo.svg';

export function InteraAnalisesLogo({
  size = 'md',
  onClick,
}: {
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}) {
  // A logo tem aspect ratio ~3:1 (1024x345)
  // Definimos a LARGURA para que seja legível, não a altura
  const widths = { sm: 160, md: 200, lg: 260 };

  return (
    <img
      src={logoSvg}
      alt="InteraAnalises"
      style={{
        width: widths[size],
        height: 'auto',
        display: 'block',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
      onClick={onClick}
    />
  );
}
