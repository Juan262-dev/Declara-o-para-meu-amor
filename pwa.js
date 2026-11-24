// Suporte progressivo à instalação; não altera autenticação nem dados remotos.
(() => {
  'use strict';
  let sugestaoInstalacao = null;
  const botao = document.getElementById('instalarApp');
  const status = document.getElementById('instalarAppStatus');
  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {
        if (status) status.textContent = 'O modo offline não está disponível neste navegador.';
      });
    });
  }
  if (!botao) return;
  window.addEventListener('beforeinstallprompt', evento => {
    evento.preventDefault();
    sugestaoInstalacao = evento;
    botao.hidden = false;
  });
  window.addEventListener('appinstalled', () => {
    sugestaoInstalacao = null;
    botao.hidden = true;
    if (status) status.textContent = 'Aplicativo adicionado à tela inicial. ♡';
  });
  botao.addEventListener('click', async () => {
    if (sugestaoInstalacao) {
      const evento = sugestaoInstalacao;
      sugestaoInstalacao = null;
      await evento.prompt();
      const resultado = await evento.userChoice;
      if (resultado?.outcome === 'accepted') botao.hidden = true;
    } else if (status) {
      status.textContent = 'Use o menu do navegador e escolha “Adicionar à tela inicial”.';
    }
  });
})();