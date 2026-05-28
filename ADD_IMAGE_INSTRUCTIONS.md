# Instrução para adicionar imagem ao repositório

## Problema
O arquivo da imagem do Canva (InteraAnalises.png) precisa ser adicionado
manualmente ao repositório pois é um arquivo binário.

## Como fazer

1. Baixe a imagem do Canva: https://www.canva.com/design/DAHK1BTgfoI/edit
   - Clique em Compartilhar → Baixar → PNG

2. Renomeie para: `ia-homepage-bg.png`

3. Coloque em: `src/pages/ia-homepage-bg.png`

4. Commit e push:
```bash
git add src/pages/ia-homepage-bg.png
git commit -m "feat: adiciona imagem de fundo da homepage"
git push
```

O site já está configurado para usar esse arquivo.
