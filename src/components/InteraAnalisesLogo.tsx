import logoSvg from '@/assets/InteraAnalisesLogo.svg';

export function InteraAnalisesLogo({
  size = 'md',
  onClick,
}: {
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}) {
  // Logo original: ~1057x344px (aspect ratio ~3:1)
  // 280px de largura conforme solicitado
  const widths = { sm: 160, md: 280, lg: 360 };

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
