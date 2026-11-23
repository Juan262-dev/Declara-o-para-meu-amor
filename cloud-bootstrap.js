// Carregador do álbum: usa dados do Supabase quando o projeto está configurado.
// Não exige login. Para editar, pede um código longo conferido NO SERVIDOR.
(async () => {
  'use strict';

  const config = window.albumCloudConfig || {};
  const url = typeof config.projectUrl === 'string' ? config.projectUrl.trim().replace(/\/+$/, '') : '';
  const valido = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url);
  const endpoint = valido ? url + '/functions/v1/album-sync' : '';
  let codigo = '';
  let assinaturaRemota = '';
  const status = document.getElementById('cloudConnectionStatus');
  const aviso = document.getElementById('cloudNewData');
  const botaoAtualizar = document.getElementById('cloudUpdateButton');

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
    if (!codigo) {
      const digitado = window.prompt(
        'Código de edição do álbum (não é login). Ele só é necessário para fazer alterações:'
      );
      if (digitado === null) throw new Error('Edição cancelada.');
      codigo = digitado.trim();
    }
    if (codigo.length < 24) {
      codigo = '';
      throw new Error('O código de edição deve ter pelo menos 24 caracteres.');
    }

    const cabecalhos = { 'x-album-edit-code': codigo };
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
      method: 'POST', headers: cabecalhos, body: corpo,
      cache: 'no-store',
    });
    const recebido = await resposta.json().catch(() => ({}));
    if (resposta.status === 403) codigo = '';
    if (!resposta.ok) throw new Error(recebido.erro || 'Não foi possível sincronizar.');
    return recebido;
  }

  const nuvem = {
    enabled: Boolean(endpoint),
    online: false,
    async saveMemory(dados, arquivo = null) { return gravar('salvar-memoria', dados, arquivo); },
    async saveExtras(dados) { return gravar('salvar-extras', dados); },
    async fetchLatest() { return buscar(); },
    async refresh() { window.location.reload(); },
  };
  window.albumCloud = nuvem;

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
        informar('☁ Lembranças sincronizadas. Sem login; código só para editar.');
      } catch (_erro) {
        informar('Nuvem indisponível. Exibindo cópia publicada; edição desativada até reconectar.', true);
      }
    } else {
      informar('Modo local: sem Supabase configurado. Suas edições permanecem neste aparelho.');
    }

    // A ordem é importante: os scripts existentes esperam os dados já preparados.
    await script('album-data.js?v=nuvem-1');
    await script('app.js?v=2026-11-19-fix-datas');
    await script('editor.js?v=nuvem-1');
    await script('experiencias.js?v=nuvem-1');
    await script('privacidade.js?v=nuvem-1');

    if (nuvem.online && botaoAtualizar && aviso) {
      botaoAtualizar.addEventListener('click', () => window.location.reload());
      // Sem atualizar a página à força e perder campos que estiverem sendo editados.
      window.setInterval(async () => {
        if (document.hidden || !nuvem.online) return;
        try {
          const dados = await buscar();
          if (JSON.stringify(dados) !== assinaturaRemota) aviso.hidden = false;
        } catch (_) {
          // A página continua funcionando com a última cópia obtida.
        }
      }, 60000);
    }
  } catch (_erro) {
    informar('Não foi possível iniciar o álbum. Atualize a página e tente novamente.', true);
  }
})();
