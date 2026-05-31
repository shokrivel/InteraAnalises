import logoSvg from '@/assets/InteraAnalisesLogo.svg';

export function InteraAnalisesLogo({
  size = 'md',
  onClick,
}: {
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}) {
  const heights = { sm: 28, md: 36, lg: 48 };
  const h = heights[size];

  return (
    <img
      src={logoSvg}
      alt="InteraAnalises"
      height={h}
      style={{
        height: h,
        width: 'auto',
        display: 'block',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
      onClick={onClick}
    />
  );
}
