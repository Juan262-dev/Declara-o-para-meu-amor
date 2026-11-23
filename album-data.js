// Etapa 1: fontes de dados do album.
// O GitHub guarda as memorias publicadas. As edicoes no navegador ficam apenas
// neste dispositivo, ate a pessoa exportar e publicar o arquivo no repositorio.
(() => {
  'use strict';

  const STORAGE_KEY = 'nossa-historia-infinita-editor-v1';
  const MAX_FOTOS = 40;
  const galeria = document.querySelector('#galeria .gallery-grid');
  if (!galeria) return;

  const fotosOriginais = Array.from(galeria.querySelectorAll('[data-memory]'));
  const dadosPublicados = Array.isArray(window.albumMemorias) ? window.albumMemorias : [];

  function textoSeguro(valor, limite = 1600) {
    return typeof valor === 'string' ? valor.trim().slice(0, limite) : '';
  }

  function dataValida(valor) {
    if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
    const [ano, mes, dia] = valor.split('-').map(Number);
    const data = new Date(ano, mes - 1, dia);
    return data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia
      ? valor : null;
  }

  // URLs HTTPS diretas ou imagens que ja estao na pasta fotos/ do projeto.
  function caminhoFotoValido(valor) {
    if (typeof valor !== 'string') return false;
    if (/^https:\/\//i.test(valor)) {
      try {
        const url = new URL(valor);
        return url.protocol === 'https:' && !url.username && !url.password && valor.length <= 1200;
      } catch (_) {
        return false;
      }
    }
    return /^fotos\/[a-zA-Z0-9_./-]+\.(jpg|jpeg|png|webp|gif)$/i.test(valor)
      && !valor.includes('..') && valor.length <= 200;
  }

  const publicados = new Map();
  dadosPublicados.forEach(dado => {
    if (dado && Number.isInteger(dado.fotoIndice)
      && dado.fotoIndice >= 0 && dado.fotoIndice < MAX_FOTOS) {
      publicados.set(dado.fotoIndice, dado);
    }
  });

  const edicoes = new Map();
  let armazenamentoDisponivel = true;
  try {
    const texto = window.localStorage.getItem(STORAGE_KEY);
    if (texto && texto.length <= 100000) {
      const dados = JSON.parse(texto);
      if (Array.isArray(dados) && dados.length <= MAX_FOTOS) {
        dados.forEach(dado => {
          if (dado && Number.isInteger(dado.fotoIndice)
            && dado.fotoIndice >= 0 && dado.fotoIndice < MAX_FOTOS) {
            edicoes.set(dado.fotoIndice, dado);
          }
        });
      }
    }
  } catch (_) {
    // O site tambem funciona em navegadores que bloqueiam localStorage.
    armazenamentoDisponivel = false;
  }

  const maxIndice = Math.min(
    MAX_FOTOS - 1,
    Math.max(fotosOriginais.length - 1, ...publicados.keys(), ...edicoes.keys())
  );
  const reunidos = [];

  for (let indice = 0; indice <= maxIndice; indice += 1) {
    const base = publicados.get(indice) || {};
    const local = edicoes.get(indice) || {};
    const original = fotosOriginais[indice] || null;
    if (!original && !publicados.has(indice) && !edicoes.has(indice)) continue;

    const fonteFoto = original?.querySelector('img')?.getAttribute('src') || '';
    const legendaOriginal = original?.querySelector('.memory-caption')?.textContent || '';
    const fonteEscolhida = textoSeguro(
      Object.prototype.hasOwnProperty.call(local, 'src') ? local.src : (base.src || fonteFoto),
      1200
    );
    const legendaEscolhida = textoSeguro(
      Object.prototype.hasOwnProperty.call(local, 'legenda') ? local.legenda : (base.legenda || legendaOriginal),
      110
    );
    const src = caminhoFotoValido(fonteEscolhida) ? fonteEscolhida : fonteFoto;
    const legenda = legendaEscolhida || legendaOriginal;

    // Uma nova foto so entra se possuir um endereco de imagem e uma legenda.
    if (!original && (!caminhoFotoValido(src) || !legenda)) continue;
    const dataEscolhida = Object.prototype.hasOwnProperty.call(local, 'data') ? local.data : base.data;
    const relatoEscolhido = Object.prototype.hasOwnProperty.call(local, 'relato') ? local.relato : base.relato;

    const memoria = Object.freeze({
      fotoIndice: indice,
      data: dataValida(dataEscolhida),
      relato: textoSeguro(relatoEscolhido, 1600),
      legenda,
      src
    });
    reunidos.push(memoria);

    let cartao = original;
    if (!cartao) {
      cartao = document.createElement('button');
      cartao.type = 'button';
      cartao.className = 'memory-card';
      cartao.setAttribute('data-memory', '');
      const foto = document.createElement('img');
      foto.loading = 'lazy';
      foto.decoding = 'async';
      foto.alt = 'Fotografia ' + (indice + 1) + ' do nosso album';
      const legendaElemento = document.createElement('span');
      legendaElemento.className = 'memory-caption';
      cartao.append(foto, legendaElemento);
      galeria.append(cartao);
    }
    cartao.querySelector('img').src = src;
    cartao.querySelector('.memory-caption').textContent = legenda;
    cartao.setAttribute('aria-label', 'Ampliar foto ' + (indice + 1) + ': ' + legenda);
  }

  if (reunidos.length > 5) galeria.classList.add('gallery-extended');
  window.albumMemorias = Object.freeze(reunidos);
  window.albumEditorConfig = Object.freeze({
    storageKey: STORAGE_KEY,
    limiteFotos: MAX_FOTOS,
    armazenamentoDisponivel
  });
})();
