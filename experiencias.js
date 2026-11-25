// Etapas 2 e 3: capítulos com navegação, bilhetes, comemorações,
// cartão de música e lista de sonhos. Sem autenticação ou envios automáticos.
(() => {
  'use strict';

  const STORAGE_KEY = 'nossa-historia-infinita-experiencias-v1';
  const publicados = window.albumSurpresas || { bilhetes: [], musica: {}, sonhos: [], surpresas: [] };
  const nuvem = window.albumCloud;
  const onde = () => nuvem?.enabled ? 'na nuvem' : 'neste aparelho';
  let ultimoErro = '';
  const maxBilhetes = 50;
  const maxSonhos = 50;
  const maxSurpresas = 20;
  const porId = id => document.getElementById(id);
  const texto = (valor, limite) => typeof valor === 'string' ? valor.trim().slice(0, limite) : '';

  function linkSeguro(valor) {
    try {
      const url = new URL(valor);
      return url.protocol === 'https:' && !url.username && !url.password && valor.length <= 1200;
    } catch (_) {
      return false;
    }
  }

  function dataSurpresaValida(valor) {
    if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
    const [ano, mes, dia] = valor.split('-').map(Number);
    const teste = new Date(Date.UTC(ano, mes - 1, dia));
    return teste.getUTCFullYear() === ano && teste.getUTCMonth() === mes - 1 && teste.getUTCDate() === dia;
  }

  function normalizarExtras(origem) {
    const data = origem && typeof origem === 'object' ? origem : {};
    const bilhetes = Array.isArray(data.bilhetes)
      ? data.bilhetes.filter(item => typeof item === 'string' && item.trim()).slice(0, maxBilhetes)
        .map(item => texto(item, 300))
      : [];
    const sonhos = Array.isArray(data.sonhos)
      ? data.sonhos.filter(item => item && typeof item === 'object').slice(0, maxSonhos)
        .map((item, indice) => ({
          id: texto(item.id, 70) || 'sonho-' + indice,
          titulo: texto(item.titulo, 140),
          concluido: item.concluido === true
        })).filter(item => item.titulo)
      : [];
    const musica = data.musica && typeof data.musica === 'object'
      ? { titulo: texto(data.musica.titulo, 110), url: texto(data.musica.url, 1200) }
      : { titulo: '', url: '' };
    if (!linkSeguro(musica.url)) musica.url = '';
    const idsSurpresas = new Set();
    const surpresas = Array.isArray(data.surpresas)
      ? data.surpresas.filter(item => {
        if (!item || typeof item !== 'object' || typeof item.id !== 'string' ||
          !item.id.trim() || item.id.length > 70 || idsSurpresas.has(item.id) ||
          typeof item.titulo !== 'string' || !item.titulo.trim() || item.titulo.length > 100 ||
          typeof item.mensagem !== 'string' || !item.mensagem.trim() || item.mensagem.length > 600 ||
          !dataSurpresaValida(item.data) || typeof item.anual !== 'boolean') return false;
        idsSurpresas.add(item.id);
        return true;
      }).slice(0, maxSurpresas).map(item => ({
        id: item.id, titulo: item.titulo.trim(), mensagem: item.mensagem.trim(),
        data: item.data, anual: item.anual
      }))
      : [];
    return { bilhetes, sonhos, musica, surpresas };
  }

  let armazenamentoDisponivel = true;
  let extras;
  if (nuvem?.enabled) {
    armazenamentoDisponivel = nuvem.online;
    extras = normalizarExtras(publicados);
  } else try {
    const salvo = window.localStorage.getItem(STORAGE_KEY);
    extras = salvo ? normalizarExtras(JSON.parse(salvo)) : normalizarExtras({
      bilhetes: [],
      musica: publicados.musica,
      sonhos: publicados.sonhos,
      surpresas: publicados.surpresas
    });
  } catch (_) {
    armazenamentoDisponivel = false;
    extras = normalizarExtras({ bilhetes: [], musica: publicados.musica, sonhos: publicados.sonhos });
  }

  function aviso(elemento, mensagem, erro = false) {
    if (!elemento) return;
    elemento.textContent = mensagem;
    elemento.dataset.erro = erro ? 'true' : 'false';
  }

  async function salvar() {
    ultimoErro = '';
    if (!armazenamentoDisponivel) {
      ultimoErro = 'A edição está indisponível até a nuvem se reconectar.';
      return false;
    }
    try {
      if (nuvem?.enabled) {
        await nuvem.saveExtras(extras);
      } else {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(extras));
      }
      return true;
    } catch (erro) {
      ultimoErro = erro?.message || 'Não foi possível salvar.';
      return false;
    }
  }

  // Capítulos como páginas navegáveis: somente um cartão visível por vez.
  const paginas = [...document.querySelectorAll('#listaCapitulos .chapter-card')];
  const pager = porId('navegacaoCapitulos');
  const anterior = porId('capituloAnterior');
  const proximo = porId('capituloProximo');
  const paginaStatus = porId('capituloPagina');
  let pagina = 0;

  function mostrarPagina(indice, deslocar = false) {
    if (!paginas.length || !pager) return;
    pagina = Math.max(0, Math.min(paginas.length - 1, indice));
    paginas.forEach((cartao, i) => {
      cartao.hidden = i !== pagina;
      cartao.classList.toggle('chapter-page-active', i === pagina);
    });
    anterior.disabled = pagina === 0;
    proximo.disabled = pagina === paginas.length - 1;
    paginaStatus.textContent = 'Página ' + (pagina + 1) + ' de ' + paginas.length;
    pager.hidden = paginas.length < 2;
    if (deslocar) {
      const reduzido = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      paginas[pagina].scrollIntoView?.({ block: 'center', behavior: reduzido ? 'auto' : 'smooth' });
    }
  }
  if (anterior && proximo && paginaStatus && paginas.length) {
    anterior.addEventListener('click', () => mostrarPagina(pagina - 1, true));
    proximo.addEventListener('click', () => mostrarPagina(pagina + 1, true));
    mostrarPagina(0);
  }

  // Surpresa mensal: informa o dia, mas não muda a data original do namoro.
  const painelComemoracao = porId('mensagemComemoracao');
  const hoje = new Date();
  const inicio = new Date(2026, 8, 29);
  if (painelComemoracao && hoje >= inicio && hoje.getDate() === 29) {
    painelComemoracao.hidden = false;
  }

  // Um pote de bilhetes pessoais. As mensagens iniciais vêm do app.
  const bilhetesBase = nuvem?.enabled ? [] : Array.isArray(publicados.bilhetes)
    ? publicados.bilhetes.filter(item => typeof item === 'string').map(item => texto(item, 300)).filter(Boolean)
    : [];
  const bilheteVisivel = porId('bilheteSorteado');
  const botaoBilhete = porId('sortearBilhete');
  const formularioBilhete = porId('formNovoBilhete');
  const campoBilhete = porId('textoNovoBilhete');
  const listaBilhetes = porId('listaBilhetesNovos');
  const statusBilhetes = porId('statusBilhetes');
  let ultimoBilhete = -1;

  function sortearBilhete() {
    const todos = [...new Set([...bilhetesBase, ...extras.bilhetes])];
    if (!todos.length) {
      bilheteVisivel.textContent = 'Adicione um bilhetinho para começar este pote.';
      return;
    }
    let indice = Math.floor(Math.random() * todos.length);
    if (todos.length > 1 && indice === ultimoBilhete) {
      indice = (indice + 1) % todos.length;
    }
    ultimoBilhete = indice;
    bilheteVisivel.textContent = todos[indice];
    bilheteVisivel.classList.remove('bilhete-revelado');
    // Reinicia a transição sem depender de scripts externos.
    void bilheteVisivel.offsetWidth;
    bilheteVisivel.classList.add('bilhete-revelado');
  }

  function renderizarBilhetes() {
    listaBilhetes.replaceChildren();
    extras.bilhetes.forEach((mensagem, indice) => {
      const item = document.createElement('li');
      const textoBilhete = document.createElement('span');
      textoBilhete.textContent = mensagem;
      const apagar = document.createElement('button');
      apagar.type = 'button';
      apagar.textContent = 'Remover';
      apagar.setAttribute('aria-label', 'Remover bilhete: ' + mensagem);
      apagar.addEventListener('click', async () => {
        const removido = extras.bilhetes.splice(indice, 1)[0];
        if (await salvar()) {
          aviso(statusBilhetes, 'Bilhete removido ' + onde() + '.');
          renderizarBilhetes();
        } else {
          extras.bilhetes.splice(indice, 0, removido);
          aviso(statusBilhetes, ultimoErro, true);
        }
      });
      item.append(textoBilhete, apagar);
      listaBilhetes.append(item);
    });
  }

  if (botaoBilhete && formularioBilhete) {
    botaoBilhete.addEventListener('click', sortearBilhete);
    formularioBilhete.addEventListener('submit', async evento => {
      evento.preventDefault();
      const mensagem = texto(campoBilhete.value, 300);
      if (!mensagem || extras.bilhetes.length >= maxBilhetes) {
        aviso(statusBilhetes, 'Escreva até 300 caracteres (máximo de 50 bilhetes adicionais).', true);
        return;
      }
      extras.bilhetes.push(mensagem);
      if (!(await salvar())) {
        extras.bilhetes.pop();
        aviso(statusBilhetes, ultimoErro, true);
        return;
      }
      campoBilhete.value = '';
      nuvem?.formSaved?.(formularioBilhete);
      renderizarBilhetes();
      aviso(statusBilhetes, 'Bilhete guardado ' + onde() + '.');
    });
    renderizarBilhetes();
  }

  // Música: somente LINK EXTERNO; o app não copia nem reproduz música protegida.
  const formularioMusica = porId('formMusica');
  const campoTituloMusica = porId('musicaTitulo');
  const campoUrlMusica = porId('musicaUrl');
  const linkMusica = porId('abrirMusica');
  const semMusica = porId('musicaNaoDefinida');
  const statusMusica = porId('statusMusica');

  function mostrarMusica() {
    campoTituloMusica.value = extras.musica.titulo;
    campoUrlMusica.value = extras.musica.url;
    const disponivel = linkSeguro(extras.musica.url);
    linkMusica.hidden = !disponivel;
    semMusica.hidden = disponivel;
    if (disponivel) {
      linkMusica.href = extras.musica.url;
      linkMusica.textContent = 'Ouvir ' + (extras.musica.titulo || 'nossa música') + ' ↗';
    } else {
      linkMusica.removeAttribute('href');
    }
  }
  if (formularioMusica) {
    mostrarMusica();
    formularioMusica.addEventListener('submit', async evento => {
      evento.preventDefault();
      const titulo = texto(campoTituloMusica.value, 110);
      const url = texto(campoUrlMusica.value, 1200);
      if (url && !linkSeguro(url)) {
        aviso(statusMusica, 'Use um link HTTPS válido para a música.', true);
        return;
      }
      if (url && !titulo) {
        aviso(statusMusica, 'Escreva também o nome da música.', true);
        return;
      }
      const anterior = extras.musica;
      extras.musica = { titulo, url };
      if (!(await salvar())) {
        extras.musica = anterior;
        aviso(statusMusica, ultimoErro, true);
        return;
      }
      mostrarMusica();
      nuvem?.formSaved?.(formularioMusica);
      aviso(statusMusica, 'Cartão de música atualizado ' + onde() + '.');
    });
  }

  // Lista de sonhos: fatos que vocês desejam realizar, nunca histórias inventadas.
  const formularioSonho = porId('formNovoSonho');
  const campoSonho = porId('textoNovoSonho');
  const listaSonhos = porId('listaSonhos');
  const statusSonhos = porId('statusSonhos');

  function renderizarSonhos() {
    listaSonhos.replaceChildren();
    extras.sonhos.forEach((sonho, indice) => {
      const item = document.createElement('li');
      item.className = sonho.concluido ? 'sonho-concluido' : '';
      const label = document.createElement('label');
      const check = document.createElement('input');
      check.type = 'checkbox';
      check.checked = sonho.concluido;
      check.addEventListener('change', async () => {
        const antigo = sonho.concluido;
        sonho.concluido = check.checked;
        if (!(await salvar())) {
          sonho.concluido = antigo;
          check.checked = antigo;
          aviso(statusSonhos, ultimoErro, true);
          return;
        }
        renderizarSonhos();
        aviso(statusSonhos, 'Lista atualizada ' + onde() + '.');
      });
      const titulo = document.createElement('span');
      titulo.textContent = sonho.titulo;
      label.append(check, titulo);
      const apagar = document.createElement('button');
      apagar.type = 'button';
      apagar.textContent = 'Remover';
      apagar.setAttribute('aria-label', 'Remover sonho: ' + sonho.titulo);
      apagar.addEventListener('click', async () => {
        const removido = extras.sonhos.splice(indice, 1)[0];
        if (!(await salvar())) {
          extras.sonhos.splice(indice, 0, removido);
          aviso(statusSonhos, ultimoErro, true);
          return;
        }
        renderizarSonhos();
        aviso(statusSonhos, 'Sonho removido ' + onde() + '.');
      });
      item.append(label, apagar);
      listaSonhos.append(item);
    });
    porId('sonhosVazio').hidden = extras.sonhos.length > 0;
  }

  if (formularioSonho) {
    formularioSonho.addEventListener('submit', async evento => {
      evento.preventDefault();
      const titulo = texto(campoSonho.value, 140);
      if (!titulo || extras.sonhos.length >= maxSonhos) {
        aviso(statusSonhos, 'Escreva até 140 caracteres (máximo de 50 sonhos).', true);
        return;
      }
      const novo = { id: String(Date.now()) + '-' + String(Math.floor(Math.random() * 100000)), titulo, concluido: false };
      extras.sonhos.push(novo);
      if (!(await salvar())) {
        extras.sonhos.pop();
        aviso(statusSonhos, ultimoErro, true);
        return;
      }
      campoSonho.value = '';
      nuvem?.formSaved?.(formularioSonho);
      renderizarSonhos();
      aviso(statusSonhos, 'Sonho adicionado ' + onde() + '.');
    });
    renderizarSonhos();
  }

  // Cartinhas que aparecem na data marcada. A ocultação é somente visual:
  // o álbum é público e os dados podem ser consultados e editados pelos visitantes.
  const formSurpresa = porId('formSurpresaProgramada');
  const tituloSurpresa = porId('surpresaTitulo');
  const mensagemSurpresa = porId('surpresaMensagem');
  const dataSurpresa = porId('surpresaData');
  const anualSurpresa = porId('surpresaAnual');
  const listaAgendadas = porId('listaSurpresasProgramadas');
  const listaReveladas = porId('listaSurpresasReveladas');
  const avisoSurpresa = porId('statusSurpresasProgramadas');
  const cancelarSurpresa = porId('cancelarEdicaoSurpresa');
  const botaoSurpresa = porId('salvarSurpresaProgramada');
  let surpresaEditada = null;

  function dataLocal(agora = new Date()) {
    return agora.getFullYear() + '-' +
      String(agora.getMonth() + 1).padStart(2, '0') + '-' +
      String(agora.getDate()).padStart(2, '0');
  }

  function formatarData(data, anual = false) {
    const [ano, mes, dia] = data.split('-');
    return dia + '/' + mes + (anual ? ' (todo ano)' : '/' + ano);
  }

  function podeRevelar(item, hoje = dataLocal()) {
    if (hoje < item.data) return false;
    return item.anual ? hoje.slice(5) === item.data.slice(5) : true;
  }

  function renderizarSurpresas() {
    if (!listaAgendadas || !listaReveladas) return;
    listaAgendadas.replaceChildren();
    listaReveladas.replaceChildren();
    if (!extras.surpresas.length) {
      const vazio = document.createElement('p');
      vazio.textContent = 'Nenhuma surpresa programada ainda. Escolha uma data e escreva a primeira cartinha.';
      listaReveladas.append(vazio);
    }

    for (const item of extras.surpresas) {
      const revelada = podeRevelar(item);
      const cartao = document.createElement('article');
      cartao.className = 'surpresa-data-card ' + (revelada ? 'surpresa-revelada' : 'surpresa-bloqueada');
      const titulo = document.createElement('h3');
      titulo.textContent = revelada ? item.titulo : '♡ Uma cartinha para uma data especial';
      const quando = document.createElement('p');
      quando.className = 'surpresa-data-quando';
      quando.textContent = revelada
        ? 'Aberta em ' + formatarData(item.data, item.anual)
        : '🔒 Abre em ' + formatarData(item.data, item.anual);
      const textoSurpresa = document.createElement('p');
      textoSurpresa.className = 'surpresa-data-texto';
      textoSurpresa.textContent = revelada
        ? item.mensagem
        : 'Esta mensagem aparece quando chegar a data marcada.';
      cartao.append(quando, titulo, textoSurpresa);
      listaReveladas.append(cartao);

      const linha = document.createElement('li');
      const descricao = document.createElement('span');
      descricao.textContent = item.titulo + ' — ' + formatarData(item.data, item.anual);
      const acoes = document.createElement('div');
      acoes.className = 'surpresa-data-acoes';
      const editar = document.createElement('button');
      editar.type = 'button';
      editar.textContent = 'Editar';
      editar.addEventListener('click', () => {
        surpresaEditada = item.id;
        tituloSurpresa.value = item.titulo;
        mensagemSurpresa.value = item.mensagem;
        dataSurpresa.value = item.data;
        anualSurpresa.checked = item.anual;
        botaoSurpresa.textContent = 'Salvar alterações';
        cancelarSurpresa.hidden = false;
        formSurpresa.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
      });
      const remover = document.createElement('button');
      remover.type = 'button';
      remover.textContent = 'Remover';
      remover.addEventListener('click', async () => {
        if (!window.confirm('Remover esta surpresa programada de todos os aparelhos?')) return;
        const anterior = [...extras.surpresas];
        extras.surpresas = extras.surpresas.filter(s => s.id !== item.id);
        if (!(await salvar())) {
          extras.surpresas = anterior;
          aviso(avisoSurpresa, ultimoErro, true);
          return;
        }
        renderizarSurpresas();
        aviso(avisoSurpresa, 'Surpresa removida ' + onde() + '.');
      });
      acoes.append(editar, remover);
      linha.append(descricao, acoes);
      listaAgendadas.append(linha);
    }
  }

  function limparEdicaoSurpresa() {
    surpresaEditada = null;
    formSurpresa?.reset();
    if (botaoSurpresa) botaoSurpresa.textContent = 'Programar cartinha ♡';
    if (cancelarSurpresa) cancelarSurpresa.hidden = true;
    nuvem?.formSaved?.(formSurpresa);
  }

  if (formSurpresa && listaAgendadas && listaReveladas) {
    formSurpresa.addEventListener('submit', async evento => {
      evento.preventDefault();
      const titulo = tituloSurpresa.value.trim();
      const mensagem = mensagemSurpresa.value.trim();
      const data = dataSurpresa.value;
      const anual = anualSurpresa.checked;
      if (!titulo || titulo.length > 100 || !mensagem || mensagem.length > 600 ||
        !dataSurpresaValida(data)) {
        aviso(avisoSurpresa, 'Preencha título, cartinha e uma data válida.', true);
        return;
      }
      if (!surpresaEditada && extras.surpresas.length >= maxSurpresas) {
        aviso(avisoSurpresa, 'O limite é de 20 cartinhas programadas.', true);
        return;
      }
      const anterior = [...extras.surpresas];
      const id = surpresaEditada || ('surpresa-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10));
      const nova = { id, titulo, mensagem, data, anual };
      if (surpresaEditada) {
        extras.surpresas = extras.surpresas.map(item => item.id === id ? nova : item);
      } else {
        extras.surpresas.push(nova);
      }
      if (!(await salvar())) {
        extras.surpresas = anterior;
        aviso(avisoSurpresa, ultimoErro, true);
        return;
      }
      limparEdicaoSurpresa();
      renderizarSurpresas();
      aviso(avisoSurpresa, 'Cartinha programada ' + onde() + '.');
    });
    cancelarSurpresa?.addEventListener('click', limparEdicaoSurpresa);
    renderizarSurpresas();
    // Uma cartinha também se revela sem recarregar se o app ficar aberto à meia-noite.
    window.setInterval(renderizarSurpresas, 60 * 1000);
  }

  // Backups e publicação usam cópias validadas deste objeto.
  window.albumExperiencias = Object.freeze({
    storageKey: STORAGE_KEY,
    ler: () => JSON.parse(JSON.stringify(extras)),
    normalizar: normalizarExtras,
    linkSeguro,
    armazenamentoDisponivel
  });
})();
