// Etapas 2 e 3: capítulos com navegação, bilhetes, comemorações,
// cartão de música e lista de sonhos. Sem autenticação ou envios automáticos.
(() => {
  'use strict';

  const STORAGE_KEY = 'nossa-historia-infinita-experiencias-v1';
  const publicados = window.albumSurpresas || { bilhetes: [], musica: {}, sonhos: [] };
  const maxBilhetes = 50;
  const maxSonhos = 50;
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
    return { bilhetes, sonhos, musica };
  }

  let armazenamentoDisponivel = true;
  let extras;
  try {
    const salvo = window.localStorage.getItem(STORAGE_KEY);
    extras = salvo ? normalizarExtras(JSON.parse(salvo)) : normalizarExtras(publicados);
  } catch (_) {
    armazenamentoDisponivel = false;
    extras = normalizarExtras(publicados);
  }

  function aviso(elemento, mensagem, erro = false) {
    if (!elemento) return;
    elemento.textContent = mensagem;
    elemento.dataset.erro = erro ? 'true' : 'false';
  }

  function salvar() {
    if (!armazenamentoDisponivel) return false;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(extras));
      return true;
    } catch (_) {
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
  const bilhetesBase = Array.isArray(publicados.bilhetes)
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
    const todos = [...bilhetesBase, ...extras.bilhetes];
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
      apagar.addEventListener('click', () => {
        extras.bilhetes.splice(indice, 1);
        if (salvar()) {
          aviso(statusBilhetes, 'Bilhete removido deste aparelho.');
          renderizarBilhetes();
        } else {
          aviso(statusBilhetes, 'Não foi possível salvar neste aparelho.', true);
        }
      });
      item.append(textoBilhete, apagar);
      listaBilhetes.append(item);
    });
  }

  if (botaoBilhete && formularioBilhete) {
    botaoBilhete.addEventListener('click', sortearBilhete);
    formularioBilhete.addEventListener('submit', evento => {
      evento.preventDefault();
      const mensagem = texto(campoBilhete.value, 300);
      if (!mensagem || extras.bilhetes.length >= maxBilhetes) {
        aviso(statusBilhetes, 'Escreva até 300 caracteres (máximo de 50 bilhetes adicionais).', true);
        return;
      }
      extras.bilhetes.push(mensagem);
      if (!salvar()) {
        extras.bilhetes.pop();
        aviso(statusBilhetes, 'Este navegador não conseguiu salvar o bilhete.', true);
        return;
      }
      campoBilhete.value = '';
      renderizarBilhetes();
      aviso(statusBilhetes, 'Bilhete guardado apenas neste aparelho.');
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
    formularioMusica.addEventListener('submit', evento => {
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
      if (!salvar()) {
        extras.musica = anterior;
        aviso(statusMusica, 'Não foi possível salvar a música no aparelho.', true);
        return;
      }
      mostrarMusica();
      aviso(statusMusica, 'Cartão de música atualizado apenas neste aparelho.');
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
      check.addEventListener('change', () => {
        const antigo = sonho.concluido;
        sonho.concluido = check.checked;
        if (!salvar()) {
          sonho.concluido = antigo;
          check.checked = antigo;
          aviso(statusSonhos, 'Não foi possível guardar a atualização.', true);
          return;
        }
        renderizarSonhos();
        aviso(statusSonhos, 'Lista atualizada neste aparelho.');
      });
      const titulo = document.createElement('span');
      titulo.textContent = sonho.titulo;
      label.append(check, titulo);
      const apagar = document.createElement('button');
      apagar.type = 'button';
      apagar.textContent = 'Remover';
      apagar.setAttribute('aria-label', 'Remover sonho: ' + sonho.titulo);
      apagar.addEventListener('click', () => {
        const removido = extras.sonhos.splice(indice, 1)[0];
        if (!salvar()) {
          extras.sonhos.splice(indice, 0, removido);
          aviso(statusSonhos, 'Não foi possível guardar a remoção.', true);
          return;
        }
        renderizarSonhos();
        aviso(statusSonhos, 'Sonho removido da lista local.');
      });
      item.append(label, apagar);
      listaSonhos.append(item);
    });
    porId('sonhosVazio').hidden = extras.sonhos.length > 0;
  }

  if (formularioSonho) {
    formularioSonho.addEventListener('submit', evento => {
      evento.preventDefault();
      const titulo = texto(campoSonho.value, 140);
      if (!titulo || extras.sonhos.length >= maxSonhos) {
        aviso(statusSonhos, 'Escreva até 140 caracteres (máximo de 50 sonhos).', true);
        return;
      }
      const novo = { id: String(Date.now()) + '-' + String(Math.floor(Math.random() * 100000)), titulo, concluido: false };
      extras.sonhos.push(novo);
      if (!salvar()) {
        extras.sonhos.pop();
        aviso(statusSonhos, 'Não foi possível salvar o sonho.', true);
        return;
      }
      campoSonho.value = '';
      renderizarSonhos();
      aviso(statusSonhos, 'Sonho adicionado neste aparelho.');
    });
    renderizarSonhos();
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
