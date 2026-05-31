// @ts-ignore
import logoPng from '@/assets/InteraAnalisesLogo.png';

export function InteraAnalisesLogo({
  size = 'md',
  onClick,
}: {
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}) {
  // sm = nav header (altura ~32px) | md = 280px largura | lg = maior
  const widths = { sm: 180, md: 280, lg: 360 };

  return (
    <img
      src={logoPng}
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
