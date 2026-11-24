// Carrega lembranças e mantém a página sincronizada com Supabase Realtime.
// Sem login e sem código. O canal anuncia apenas VERSÕES, nunca fotos ou relatos.
(async () => {
  'use strict';

  const config = window.albumCloudConfig || {};
  const url = typeof config.projectUrl === 'string' ? config.projectUrl.trim().replace(/\/+$/, '') : '';
  const valido = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url);
  const endpoint = valido ? url + '/functions/v1/album-sync' : '';
  const chavePublica = typeof config.publishableKey === 'string'
    && /^sb_publishable_[a-zA-Z0-9_-]+$/.test(config.publishableKey)
    ? config.publishableKey : '';
  const SCROLL_KEY = 'album-realtime-scroll-v1';
  const status = document.getElementById('cloudConnectionStatus');
  const aviso = document.getElementById('cloudNewData');
  const botaoAtualizar = document.getElementById('cloudUpdateButton');

  let assinaturaRemota = '';
  const formulariosPendentes = new Set();
  let verificando = false;
  let verificacaoPendente = false;
  let avisoPendente = false;
  let clienteRealtime = null;
  let canalRealtime = null;

  function informar(mensagem, erro = false) {
    if (!status) return;
    status.textContent = mensagem;
    status.dataset.erro = erro ? 'true' : 'false';
  }

  function script(src) {
    return new Promise((resolve, reject) => {
      const tag = document.createElement('script');
      tag.src = src;
      tag.async = false;
      tag.onload = resolve;
      tag.onerror = () => reject(new Error('Falha ao carregar ' + src));
      document.head.append(tag);
    });
  }

  function validarResposta(dados) {
    if (!dados || !Array.isArray(dados.memorias) || !dados.extras ||
      !Array.isArray(dados.extras.bilhetes) || !Array.isArray(dados.extras.sonhos) ||
      !dados.extras.musica || dados.memorias.length < 5 || dados.memorias.length > 40) {
      throw new Error('O serviço retornou um álbum incompleto.');
    }
    const indices = dados.memorias.map(m => m.fotoIndice);
    if (indices.some((v, i) => v !== i)) throw new Error('As fotografias não estão em sequência.');
    return dados;
  }

  async function buscar() {
    const resposta = await fetch(endpoint, { method: 'GET', cache: 'no-store' });
    if (!resposta.ok) throw new Error('Supabase respondeu com erro ' + resposta.status);
    return validarResposta(await resposta.json());
  }

  async function gravar(acao, dados, arquivo) {
    if (!nuvem.enabled || !nuvem.online) {
      throw new Error('A nuvem está indisponível. Não foi feita nenhuma alteração.');
    }
    // O servidor valida tamanho, formato e frequência; nenhum código de edição é usado.
    const cabecalhos = {};
    let corpo;
    if (arquivo) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(arquivo.type) ||
          arquivo.size > 5 * 1024 * 1024 || arquivo.size < 16) {
        throw new Error('Escolha uma imagem JPG, PNG ou WebP com até 5 MB.');
      }
      corpo = new FormData();
      corpo.append('acao', acao);
      corpo.append('memoria', JSON.stringify(dados));
      corpo.append('foto', arquivo, arquivo.name);
    } else {
      cabecalhos['Content-Type'] = 'application/json';
      corpo = JSON.stringify({ acao, dados });
    }

    const resposta = await fetch(endpoint, {
      method: 'POST', headers: cabecalhos, body: corpo, cache: 'no-store',
    });
    const recebido = await resposta.json().catch(() => ({}));
    if (!resposta.ok) throw new Error(recebido.erro || 'Não foi possível sincronizar.');
    return recebido;
  }

  const nuvem = {
    enabled: Boolean(endpoint),
    online: false,
    realtime: false,
    async saveMemory(dados, arquivo = null) { return gravar('salvar-memoria', dados, arquivo); },
    async saveExtras(dados) { return gravar('salvar-extras', dados); },
    async fetchLatest() { return buscar(); },
    async refresh() { window.location.reload(); },
  };
  window.albumCloud = nuvem;

  function usuarioPreenchendo() {
    // Somente alterações realmente pendentes impedem atualização automática.
    // Um campo com foco, mas sem alterações, não bloqueia a sincronização.
    return formulariosPendentes.size > 0;
  }

  function formularioModificado(evento) {
    const elemento = evento.target;
    if (!elemento || typeof elemento.closest !== 'function') return;
    const formulario = elemento.closest('form');
    if (!formulario) return;
    // Selecionar outra foto apenas muda a visualização do editor.
    if (elemento.id === 'editarEscolhaFoto') {
      formulariosPendentes.delete(formulario);
      return;
    }
    formulariosPendentes.add(formulario);
    if (avisoPendente) apresentarNovidades();
  }

  function formularioSalvo(formulario) {
    if (!formulario) return;
    formulariosPendentes.delete(formulario);
    // Assim que o último rascunho for salvo, aplica as novidades recebidas.
    if (avisoPendente && !usuarioPreenchendo()) {
      avisoPendente = false;
      void verificarNovidades();
    }
  }
  nuvem.formSaved = formularioSalvo;

  function recarregarPreservandoPosicao() {
    try {
      window.sessionStorage.setItem(SCROLL_KEY, String(window.scrollY || 0));
    } catch (_) { /* sessionStorage pode estar bloqueado. */ }
    window.location.reload();
  }

  function apresentarNovidades() {
    avisoPendente = true;
    if (aviso) {
      aviso.hidden = false;
      const mensagem = aviso.querySelector('span');
      if (mensagem) mensagem.textContent = usuarioPreenchendo()
        ? '♡ Há novidades! Termine de editar e salve antes de atualizar.'
        : '♡ Há novas lembranças na nuvem.';
    }
  }

  async function verificarNovidades() {
    if (!nuvem.online) return;
    if (document.hidden) {
      verificacaoPendente = true;
      return;
    }
    if (verificando) {
      verificacaoPendente = true;
      return;
    }
    verificando = true;
    try {
      const dados = await buscar();
      if (JSON.stringify(dados) !== assinaturaRemota) {
        if (usuarioPreenchendo()) apresentarNovidades();
        else recarregarPreservandoPosicao();
      }
    } catch (_) {
      // Offline: os dados atuais ficam na tela e o polling tenta novamente.
    } finally {
      verificando = false;
      if (verificacaoPendente && !document.hidden) {
        verificacaoPendente = false;
        // Evita recursão direta de chamadas durante mensagens em sequência.
        window.setTimeout(() => { void verificarNovidades(); }, 300);
      }
    }
  }

  async function iniciarRealtime() {
    if (!chavePublica || !nuvem.online) return;
    try {
      // Dependência fixa para não mudar automaticamente entre implantações.
      await script('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.86.0');
      if (!window.supabase || typeof window.supabase.createClient !== 'function') {
        throw new Error('Biblioteca Realtime indisponível.');
      }
      clienteRealtime = window.supabase.createClient(url, chavePublica, {
        auth: { persistSession: false, autoRefreshToken: false },
        realtime: { params: { eventsPerSecond: 2 } },
      });
      canalRealtime = clienteRealtime
        .channel('amor-versao-publica')
        .on('postgres_changes', {
          event: 'UPDATE', schema: 'public', table: 'amor_sinal',
        }, () => { void verificarNovidades(); })
        .subscribe(estado => {
          if (estado === 'SUBSCRIBED') {
            nuvem.realtime = true;
            informar('☁ Tempo real conectado. Novidades aparecem automaticamente.');
            // Recupera alterações entre o GET inicial e o início do canal.
            void verificarNovidades();
          } else if (estado === 'CHANNEL_ERROR' || estado === 'TIMED_OUT' || estado === 'CLOSED') {
            nuvem.realtime = false;
            informar('☁ Nuvem conectada. Verificando novidades periodicamente.');
          }
        });
    } catch (_) {
      nuvem.realtime = false;
      informar('☁ Nuvem conectada. Verificando novidades periodicamente.');
    }
  }

  try {
    await script('memorias.js?v=2026-11-19-fix-datas');
    await script('surpresas-data.js?v=etapa3');

    if (nuvem.enabled) {
      informar('Conectando ao álbum na nuvem…');
      try {
        const remotos = await buscar();
        window.albumMemorias = remotos.memorias;
        window.albumSurpresas = remotos.extras;
        assinaturaRemota = JSON.stringify(remotos);
        nuvem.online = true;
        informar('☁ Lembranças sincronizadas. Sem login nem código.');
      } catch (_) {
        informar('Nuvem indisponível. Exibindo cópia publicada; edição desativada até reconectar.', true);
      }
    } else {
      informar('Modo local: sem Supabase configurado. Suas edições permanecem neste aparelho.');
    }

    // Os scripts do app precisam dos dados carregados antes de inicializar.
    await script('album-data.js?v=nuvem-1');
    await script('app.js?v=2026-11-19-fix-datas');
    await script('editor.js?v=nuvem-1');
    await script('experiencias.js?v=nuvem-1');
    await script('privacidade.js?v=nuvem-1');

    // Restaura a posição após atualização automática de uma página não editada.
    try {
      const posicao = window.sessionStorage.getItem(SCROLL_KEY);
      if (posicao !== null) {
        window.sessionStorage.removeItem(SCROLL_KEY);
        window.setTimeout(() => window.scrollTo(0, Number(posicao) || 0), 100);
      }
    } catch (_) { /* Também funciona sem armazenamento local. */ }

    if (nuvem.online && botaoAtualizar && aviso) {
      botaoAtualizar.addEventListener('click', () => {
        if (usuarioPreenchendo() && !window.confirm(
          'Você está editando alguma coisa. Deseja atualizar mesmo assim? Alterações não salvas serão perdidas.'
        )) return;
        recarregarPreservandoPosicao();
      });

      document.addEventListener('input', formularioModificado);
      document.addEventListener('change', formularioModificado);
      document.addEventListener('reset', evento => {
        if (evento.target) formularioSalvo(evento.target);
      });

      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) void verificarNovidades();
      });

      // Plano B quando websocket/CDN falhar ou celular sair do modo de suspensão.
      window.setInterval(() => { void verificarNovidades(); }, 60000);
      void iniciarRealtime();
    }
  } catch (_) {
    informar('Não foi possível iniciar o álbum. Atualize a página e tente novamente.', true);
  }
})();
