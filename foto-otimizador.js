// Otimização local de fotos. Não envia nem compartilha a imagem antes de "Salvar".
(() => {
  'use strict';
  const FORMATOS = new Set(['image/jpeg', 'image/png', 'image/webp']);
  const MAX_LADO = 1800;
  const OTIMIZAR_ACIMA = 1200 * 1024;
  const LIMITE_UPLOAD = 5 * 1024 * 1024;

  async function codificar(canvas, tipo, qualidade) {
    return new Promise(resolve => {
      try { canvas.toBlob(resolve, tipo, qualidade); }
      catch (_) { resolve(null); }
    });
  }

  window.albumOtimizarFoto = async (arquivo) => {
    if (!arquivo || !FORMATOS.has(arquivo.type)) return arquivo;
    // Evita alterar a qualidade de fotos que já são leves.
    if (arquivo.size <= OTIMIZAR_ACIMA) return arquivo;
    if (typeof createImageBitmap !== 'function') return arquivo;

    let imagem = null;
    try {
      imagem = await createImageBitmap(arquivo);
      const largura = imagem.width;
      const altura = imagem.height;
      if (!largura || !altura || largura * altura > 50_000_000) return arquivo;
      const fator = Math.min(1, MAX_LADO / Math.max(largura, altura));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(largura * fator));
      canvas.height = Math.max(1, Math.round(altura * fator));
      const contexto = canvas.getContext('2d');
      if (!contexto) return arquivo;
      contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);

      // WebP mantém transparência de PNG. JPEG continua JPEG.
      const tipo = arquivo.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp';
      for (const qualidade of [0.86, 0.73, 0.6]) {
        const resultado = await codificar(canvas, tipo, qualidade);
        if (!resultado || resultado.size < 16) continue;
        if (resultado.size <= LIMITE_UPLOAD && resultado.size < arquivo.size) {
          const nome = arquivo.name.replace(/\.[^.]+$/, '') + (tipo === 'image/jpeg' ? '.jpg' : '.webp');
          return new File([resultado], nome, { type: tipo, lastModified: Date.now() });
        }
      }
      return arquivo;
    } catch (_) {
      // Sem compatibilidade com canvas: o editor continua aceitando arquivos normais.
      return arquivo;
    } finally {
      try { imagem?.close?.(); } catch (_) {}
    }
  };
})();