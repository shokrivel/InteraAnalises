// Logo do InteraAnalises em texto puro — substitui a imagem interasaude-logo.png
export function InteraAnalisesLogo({ size = 'md', onClick }: { size?: 'sm' | 'md' | 'lg'; onClick?: () => void }) {
  const sizes = { sm: '1.1rem', md: '1.35rem', lg: '1.8rem' };
  return (
    <div
      onClick={onClick}
      style={{
        fontFamily: "'Playfair Display', serif",
        fontWeight: 900,
        fontSize: sizes[size],
        color: '#0f4a2e',
        letterSpacing: '-0.5px',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        lineHeight: 1,
      }}
    >
      Intera<span style={{ color: '#c8a84b' }}>Análises</span>
    </div>
  );
}
