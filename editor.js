// Editor: usa a nuvem quando configurada; sem ela mantém o modo local.
// No modo nuvem, visitantes podem editar sem login nem código.
(() => {
  'use strict';

  const formulario = document.getElementById('formEditorMemorias');
  if (!formulario) return;

  const seletor = document.getElementById('editarEscolhaFoto');
  const campoLegenda = document.getElementById('editarLegenda');
  const campoData = document.getElementById('editarData');
  const campoRelato = document.getElementById('editarRelato');
  const campoFoto = document.getElementById('editarFonteFoto');
  const campoArquivo = document.getElementById('editarArquivoFoto');
  const nuvem = window.albumCloud;
  const previa = document.getElementById('editarPrevia');
  const botaoSalvar = document.getElementById('editarSalvar');
  const botaoExportar = document.getElementById('editarExportar');
  const botaoLimpar = document.getElementById('editarLimpar');
  const status = document.getElementById('editarStatus');
  const config = window.albumEditorConfig;
  const registros = Array.isArray(window.albumMemorias) ? window.albumMemorias : [];

  if (!config) {
    status.textContent = 'O editor não pôde carregar. Atualize a página.';
    return;
  }

  function validarData(valor) {
    if (!valor) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
    const [ano, mes, dia] = valor.split('-').map(Number);
    const data = new Date(ano, mes - 1, dia);
    return data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
  }

  function validarFoto(valor) {
    if (/^https:\/\//i.test(valor)) {
      try {
        const url = new URL(valor);
        return url.protocol === 'https:' && !url.username && !url.password && valor.length <= 1200;
      } catch (_) { return false; }
    }
    return /^fotos\/[a-zA-Z0-9_./-]+\.(jpg|jpeg|png|webp|gif)$/i.test(valor)
      && !valor.includes('..') && valor.length <= 200;
  }

  function mensagem(texto, erro = false) {
    status.textContent = texto;
    status.dataset.erro = erro ? 'true' : 'false';
  }

  function carregarEdicoes() {
    try {
      const dados = JSON.parse(window.localStorage.getItem(config.storageKey) || '[]');
      return Array.isArray(dados) ? dados.filter(dado =>
        dado && Number.isInteger(dado.fotoIndice)
        && dado.fotoIndice >= 0 && dado.fotoIndice < config.limiteFotos
      ) : [];
    } catch (_) {
      return [];
    }
  }

  function preencherFormulario() {
    const indice = seletor.value === 'nova' ? -1 : Number(seletor.value);
    const memoria = registros.find(registro => registro.fotoIndice === indice);
    campoLegenda.value = memoria?.legenda || '';
    campoData.value = memoria?.data || '';
    campoRelato.value = memoria?.relato || '';
    campoFoto.value = memoria?.src || '';
    campoFoto.required = indice === -1 && !nuvem?.enabled;
    if (campoArquivo) campoArquivo.value = '';
    atualizarPrevia();
    mensagem(indice === -1
      ? (nuvem?.enabled
        ? 'Use uma foto JPG, PNG ou WebP do celular (até 5 MB), ou informe um link HTTPS.'
        : 'Para uma foto nova, cole um link direto HTTPS ou um caminho já enviado ao GitHub em fotos/.')
      : 'Você pode atualizar esta lembrança sem alterar a foto original.');
  }

  function atualizarPrevia() {
    const endereco = campoFoto.value.trim();
    if (!validarFoto(endereco)) {
      previa.hidden = true;
      previa.removeAttribute('src');
      return;
    }
    previa.hidden = false;
    previa.src = endereco;
  }

  registros.forEach(registro => {
    const opcao = document.createElement('option');
    opcao.value = String(registro.fotoIndice);
    opcao.textContent = 'Foto ' + (registro.fotoIndice + 1) + ' — ' + registro.legenda;
    seletor.append(opcao);
  });
  if (registros.length < config.limiteFotos) {
    const opcaoNova = document.createElement('option');
    opcaoNova.value = 'nova';
    opcaoNova.textContent = '+ Adicionar nova foto por link';
    seletor.append(opcaoNova);
  }

  seletor.addEventListener('change', preencherFormulario);
  campoFoto.addEventListener('input', atualizarPrevia);
  previa.addEventListener('error', () => {
    previa.hidden = true;
    mensagem('Não foi possível visualizar a foto. Confira se o endereço abre uma imagem.', true);
  });
  botaoSalvar.disabled = !config.armazenamentoDisponivel;
  botaoLimpar.disabled = !config.armazenamentoDisponivel || Boolean(nuvem?.enabled);
  preencherFormulario();
  if (!config.armazenamentoDisponivel) {
    mensagem('Este navegador bloqueia o armazenamento local. Ainda é possível baixar as memórias publicadas.', true);
  }

  formulario.addEventListener('submit', async evento => {
    evento.preventDefault();
    if (!config.armazenamentoDisponivel) {
      mensagem('O serviço de edição está indisponível. Tente novamente quando a nuvem estiver conectada.', true);
      return;
    }

    const nova = seletor.value === 'nova';
    const indice = nova ? registros.length : Number(seletor.value);
    const legenda = campoLegenda.value.trim();
    const data = campoData.value.trim();
    const relato = campoRelato.value.trim();
    const fonte = campoFoto.value.trim();
    const arquivo = campoArquivo?.files?.[0] || null;

    if (arquivo && !nuvem?.enabled) {
      mensagem('Envio direto de fotos só está disponível com o Supabase configurado.', true);
      return;
    }
    if (!Number.isInteger(indice) || indice < 0 || indice >= config.limiteFotos) {
      mensagem('Você chegou ao limite de fotos do álbum.', true);
      return;
    }
    if (!legenda || legenda.length > 110 || relato.length > 1600) {
      mensagem('Preencha uma legenda de até 110 caracteres e um relato de até 1600 caracteres.', true);
      return;
    }
    if (!validarData(data)) {
      mensagem('Use uma data válida no formato ano-mês-dia.', true);
      return;
    }
    if (!arquivo && !validarFoto(fonte)) {
      mensagem('Use um link HTTPS, um arquivo da pasta fotos/ ou selecione uma foto no celular.', true);
      return;
    }

    const memoria = {
      fotoIndice: indice,
      legenda,
      data: data || null,
      relato,
      src: fonte
    };
    if (nuvem?.enabled) {
      botaoSalvar.disabled = true;
      try {
        await nuvem.saveMemory(memoria, arquivo);
        mensagem('Memória sincronizada na nuvem. Atualizando o álbum…');
        window.location.reload();
      } catch (erro) {
        mensagem(erro.message || 'Não foi possível salvar na nuvem.', true);
      } finally {
        botaoSalvar.disabled = false;
      }
      return;
    }
    const edicoes = carregarEdicoes().filter(item => item.fotoIndice !== indice);
    edicoes.push(memoria);
    edicoes.sort((a, b) => a.fotoIndice - b.fotoIndice);

    try {
      window.localStorage.setItem(config.storageKey, JSON.stringify(edicoes));
      mensagem('Memória salva neste aparelho. Recarregando o álbum...');
      window.location.reload();
    } catch (_) {
      mensagem('Não foi possível salvar. Verifique as permissões ou o espaço do navegador.', true);
    }
  });

  // Gera um arquivo válido de configuração; não há sincronização automática.
  botaoExportar.addEventListener('click', () => {
    const dados = registros.map(({fotoIndice, legenda, data, relato, src}) => ({
      fotoIndice, legenda, data, relato, src
    }));
    const codigo = '// Memórias exportadas do editor do álbum.\n'
      + '// Para mostrar estas mudanças a todos, substitua memorias.js no GitHub.\n'
      + 'window.albumMemorias = Object.freeze('
      + JSON.stringify(dados, null, 2) + ');\n';
    const arquivo = new Blob([codigo], {type: 'text/javascript;charset=utf-8'});
    const url = URL.createObjectURL(arquivo);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'memorias.js';
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    mensagem('Arquivo memorias.js baixado. Para publicar as mudanças, atualize esse arquivo no GitHub.');
  });

  botaoLimpar.addEventListener('click', () => {
    if (!window.confirm('Apagar somente as alterações feitas neste navegador? As memórias publicadas no GitHub não serão alteradas.')) return;
    try {
      window.localStorage.removeItem(config.storageKey);
      window.location.reload();
    } catch (_) {
      mensagem('Não foi possível limpar os dados locais.', true);
    }
  });
})();
