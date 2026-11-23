// Etapa 4: backup, restauração e publicação assistida.
// GitHub Pages NÃO protege conteúdos publicados. Nada é enviado automaticamente.
(() => {
  'use strict';

  const config = window.albumEditorConfig;
  const experiencias = window.albumExperiencias;
  const get = id => document.getElementById(id);
  if (!config || !experiencias || !get('baixarBackup')) return;

  const mensagens = get('privacidadeStatus');
  const confirmacao = get('confirmarPublicacao');
  const botaoMemorias = get('baixarPublicacaoMemorias');
  const botaoSurpresas = get('baixarPublicacaoSurpresas');
  const resumo = get('resumoPublicacao');
  const botaoBackup = get('baixarBackup');
  const inputBackup = get('restaurarBackup');
  const publicados = window.albumSurpresas || { bilhetes: [], musica: {}, sonhos: [] };

  const texto = (valor, limite) => typeof valor === 'string' ? valor.trim().slice(0, limite) : '';

  function dataValida(valor) {
    if (valor === null || valor === '') return true;
    if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
    const [ano, mes, dia] = valor.split('-').map(Number);
    const obj = new Date(ano, mes - 1, dia);
    return obj.getFullYear() === ano && obj.getMonth() === mes - 1 && obj.getDate() === dia;
  }

  function urlFotoValida(valor) {
    if (typeof valor !== 'string' || valor.length > 1200) return false;
    if (/^https:\/\//i.test(valor)) {
      try {
        const url = new URL(valor);
        return url.protocol === 'https:' && !url.username && !url.password;
      } catch (_) { return false; }
    }
    return /^fotos\/[a-zA-Z0-9_./-]+\.(jpg|jpeg|png|webp|gif)$/i.test(valor)
      && valor.length <= 200 && !valor.includes('..');
  }

  function detalhesMemorias() {
    return (window.albumMemorias || []).map(item => ({
      fotoIndice: item.fotoIndice,
      data: item.data || null,
      relato: texto(item.relato, 1600),
      legenda: texto(item.legenda, 110),
      src: texto(item.src, 1200)
    }));
  }

  function validarMemorias(registros) {
    if (!Array.isArray(registros) || registros.length < 5 || registros.length > config.limiteFotos) {
      throw new Error('O backup precisa conter as cinco fotos originais e respeitar o limite do álbum.');
    }
    const indices = new Set();
    const validados = registros.map(item => {
      if (!item || !Number.isInteger(item.fotoIndice) || item.fotoIndice < 0 ||
        item.fotoIndice >= config.limiteFotos || indices.has(item.fotoIndice)) {
        throw new Error('Os números das fotos no backup são inválidos ou repetidos.');
      }
      indices.add(item.fotoIndice);
      if (typeof item.legenda !== 'string' || !item.legenda.trim() || item.legenda.length > 110 ||
        typeof item.relato !== 'string' || item.relato.length > 1600 ||
        !urlFotoValida(item.src) || !dataValida(item.data)) {
        throw new Error('O backup contém uma foto, data, legenda ou relato inválido.');
      }
      return {
        fotoIndice: item.fotoIndice, legenda: item.legenda.trim(),
        data: item.data || null, relato: item.relato.trim(), src: item.src
      };
    }).sort((a, b) => a.fotoIndice - b.fotoIndice);
    if (validados.some((item, indice) => item.fotoIndice !== indice)) {
      throw new Error('As fotografias do backup precisam estar numeradas sem lacunas a partir de zero.');
    }
    return validados;
  }

  function validarExtras(data) {
    if (!data || typeof data !== 'object' || !Array.isArray(data.bilhetes)
      || !Array.isArray(data.sonhos) || !data.musica || typeof data.musica !== 'object') {
      throw new Error('O backup não contém a lista de surpresas esperada.');
    }
    if (data.bilhetes.length > 50 || data.sonhos.length > 50 ||
        data.bilhetes.some(valor => typeof valor !== 'string' || !valor.trim() || valor.length > 300) ||
        data.sonhos.some(valor => !valor || typeof valor.id !== 'string' || valor.id.length > 70 ||
          typeof valor.titulo !== 'string' || !valor.titulo.trim() || valor.titulo.length > 140 ||
          typeof valor.concluido !== 'boolean')) {
      throw new Error('O backup possui bilhetes ou sonhos fora dos limites.');
    }
    const titulo = data.musica.titulo;
    const url = data.musica.url;
    if (typeof titulo !== 'string' || titulo.length > 110 ||
      typeof url !== 'string' || url.length > 1200 ||
      (url && (!experiencias.linkSeguro(url) || !titulo.trim()))) {
      throw new Error('O link ou título da música no backup é inválido.');
    }
    return experiencias.normalizar(data);
  }

  function mostrarStatus(mensagem, erro = false) {
    mensagens.textContent = mensagem;
    mensagens.dataset.erro = erro ? 'true' : 'false';
  }

  function baixarArquivo(nome, conteudo, mime) {
    const arquivo = new Blob([conteudo], { type: mime });
    const url = URL.createObjectURL(arquivo);
    const link = document.createElement('a');
    link.href = url;
    link.download = nome;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function atualizarResumo() {
    const mems = detalhesMemorias();
    const extras = experiencias.ler();
    resumo.textContent = mems.length + ' fotos, ' +
      mems.filter(m => m.relato).length + ' relatos, ' +
      (Array.isArray(publicados.bilhetes) ? publicados.bilhetes.length : 0) +
      extras.bilhetes.length + ' bilhetes no total, ' + extras.sonhos.length +
      ' sonhos e ' + (extras.musica.url ? 'um link de música' : 'nenhum link de música') +
      '. Só os arquivos que você enviar ao GitHub serão publicados.';
  }
  atualizarResumo();

  confirmacao.addEventListener('change', () => {
    botaoMemorias.disabled = !confirmacao.checked;
    botaoSurpresas.disabled = !confirmacao.checked;
  });

  botaoBackup.addEventListener('click', () => {
    const dados = {
      tipo: 'nossa-historia-infinita-backup',
      versao: 1,
      exportadoEm: new Date().toISOString(),
      memorias: detalhesMemorias(),
      experiencias: experiencias.ler()
    };
    baixarArquivo('backup-nossa-historia-infinita.json', JSON.stringify(dados, null, 2), 'application/json;charset=utf-8');
    mostrarStatus('Backup baixado. Ele contém lembranças pessoais: guarde em um lugar seguro e não envie a desconhecidos.');
  });

  botaoMemorias.addEventListener('click', () => {
    if (!confirmacao.checked) return;
    try {
      const dados = validarMemorias(detalhesMemorias());
      const script = '// Memórias publicadas no App do Meu Amor.\n' +
        'window.albumMemorias = Object.freeze(' + JSON.stringify(dados, null, 2) + ');\n';
      baixarArquivo('memorias.js', script, 'text/javascript;charset=utf-8');
      mostrarStatus('memorias.js baixado. Revise as informações antes de publicar no GitHub.');
    } catch (erro) { mostrarStatus(erro.message, true); }
  });

  botaoSurpresas.addEventListener('click', () => {
    if (!confirmacao.checked) return;
    const extras = experiencias.ler();
    const bilhetesPublicados = Array.isArray(publicados.bilhetes) ? publicados.bilhetes : [];
    const dados = {
      bilhetes: [...new Set([...bilhetesPublicados, ...extras.bilhetes])],
      musica: extras.musica,
      sonhos: extras.sonhos
    };
    try {
      validarExtras({ bilhetes: extras.bilhetes, musica: extras.musica, sonhos: extras.sonhos });
      const script = '// Surpresas publicadas no App do Meu Amor.\n' +
        'window.albumSurpresas = Object.freeze(' + JSON.stringify(dados, null, 2) + ');\n';
      baixarArquivo('surpresas-data.js', script, 'text/javascript;charset=utf-8');
      mostrarStatus('surpresas-data.js baixado. Revise os bilhetes e sonhos antes de publicar.');
    } catch (erro) { mostrarStatus(erro.message, true); }
  });

  inputBackup.addEventListener('change', async () => {
    const arquivo = inputBackup.files?.[0];
    if (!arquivo) return;
    if (!config.armazenamentoDisponivel || !experiencias.armazenamentoDisponivel) {
      mostrarStatus('Este navegador não permite guardar os dados restaurados.', true);
      inputBackup.value = '';
      return;
    }
    if (arquivo.size > 200000) {
      mostrarStatus('O arquivo é grande demais para um backup deste álbum (máximo 200 KB).', true);
      inputBackup.value = '';
      return;
    }
    try {
      const dados = JSON.parse(await arquivo.text());
      if (dados?.tipo !== 'nossa-historia-infinita-backup' || dados?.versao !== 1) {
        throw new Error('Selecione um backup JSON exportado por este aplicativo.');
      }
      const memorias = validarMemorias(dados.memorias);
      const extras = validarExtras(dados.experiencias);
      if (!window.confirm('Restaurar este backup? As edições locais deste aparelho serão substituídas. Nenhum arquivo do GitHub será alterado.')) {
        inputBackup.value = '';
        return;
      }
      const anteriorMemorias = window.localStorage.getItem(config.storageKey);
      const anteriorExtras = window.localStorage.getItem(experiencias.storageKey);
      try {
        window.localStorage.setItem(config.storageKey, JSON.stringify(memorias));
        window.localStorage.setItem(experiencias.storageKey, JSON.stringify(extras));
      } catch (erro) {
        // Restaura o estado anterior caso a segunda gravação falhe.
        try {
          if (anteriorMemorias === null) window.localStorage.removeItem(config.storageKey);
          else window.localStorage.setItem(config.storageKey, anteriorMemorias);
          if (anteriorExtras === null) window.localStorage.removeItem(experiencias.storageKey);
          else window.localStorage.setItem(experiencias.storageKey, anteriorExtras);
        } catch (_) { /* armazenamento pode estar bloqueado */ }
        throw new Error('Não foi possível guardar este backup no aparelho.');
      }
      mostrarStatus('Backup restaurado neste aparelho. Atualizando o álbum...');
      window.location.reload();
    } catch (erro) {
      mostrarStatus(erro.message || 'Não foi possível ler o backup.', true);
    } finally {
      inputBackup.value = '';
    }
  });
})();
