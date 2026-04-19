export function InteraAnalisesLogo({
  size = 'md',
  onClick,
  inverted = false,
}: {
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  inverted?: boolean;
}) {
  const sizes = { sm: 14, md: 18, lg: 24 };
  const fs = sizes[size];
  const teal = inverted ? '#ffffff' : '#0d7a5f';
  const muted = inverted ? 'rgba(255,255,255,0.7)' : '#6b7280';

  return (
    <div
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        cursor: onClick ? 'pointer' : 'default', userSelect: 'none',
      }}
    >
      {/* Marca — ícone de frasco + cruz */}
      <svg width={fs * 1.8} height={fs * 1.8} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="36" rx="9" fill={inverted ? 'rgba(255,255,255,0.15)' : '#e6f5f0'}/>
        {/* Frasco */}
        <path d="M13 9h10v6l4 10a2 2 0 01-1.87 2.73H10.87A2 2 0 019 25l4-10V9z"
          stroke={teal} strokeWidth="2" strokeLinejoin="round" fill="none"/>
        {/* Líquido dentro */}
        <path d="M10 22h16" stroke={teal} strokeWidth="1.5" strokeDasharray="2 1"/>
        {/* Cruz médica */}
        <line x1="18" y1="13" x2="18" y2="18" stroke={teal} strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="15.5" y1="15.5" x2="20.5" y2="15.5" stroke={teal} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
      {/* Texto */}
      <div style={{ lineHeight: 1.15 }}>
        <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: fs, color: teal, letterSpacing: '-0.4px' }}>
          InteraAnalises
        </div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: fs * 0.65, color: muted, letterSpacing: '0.2px' }}>
          Análise de exames com IA
        </div>
      </div>
    </div>
  );
}
