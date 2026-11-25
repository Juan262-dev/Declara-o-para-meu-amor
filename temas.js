// Tema visual salvo somente neste dispositivo, sem enviar preferências ao servidor.
(() => {
  'use strict';
  const chave = 'nosso-album-tema-v1';
  const temas = ['rosa', 'vermelho', 'lilas', 'escuro'];
  const meta = document.querySelector('meta[name="theme-color"]');
  const cores = { rosa: '#fffaf6', vermelho: '#fff5f4', lilas: '#f9f5ff', escuro: '#211a2b' };

  function escolher(tema) {
    if (!temas.includes(tema)) tema = 'rosa';
    document.documentElement.dataset.tema = tema;
    for (const botao of document.querySelectorAll('[data-tema-escolha]')) {
      botao.setAttribute('aria-pressed', String(botao.dataset.temaEscolha === tema));
    }
    if (meta) meta.setAttribute('content', cores[tema]);
  }
  let inicial = 'rosa';
  try { inicial = window.localStorage.getItem(chave) || 'rosa'; }
  catch (_) { /* Permissões de armazenamento podem estar bloqueadas. */ }
  escolher(inicial);

  for (const botao of document.querySelectorAll('[data-tema-escolha]')) {
    botao.addEventListener('click', () => {
      const tema = botao.dataset.temaEscolha;
      if (!temas.includes(tema)) return;
      escolher(tema);
      try { window.localStorage.setItem(chave, tema); } catch (_) {}
    });
  }
  window.addEventListener('storage', evento => {
    if (evento.key === chave) escolher(evento.newValue || 'rosa');
  });
})();
