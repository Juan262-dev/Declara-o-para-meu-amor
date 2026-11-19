// App do Meu Amor — interações do álbum de memórias.
// Funciona sem bibliotecas e não envia dados a serviços externos.
(() => {
  'use strict';

  // Fotos: usamos as mesmas imagens e legendas exibidas na página.
  const fotos = [...document.querySelectorAll('[data-memory]')];
  const dialog = document.getElementById('fotoDialog');
  const dialogImg = document.getElementById('fotoAmpliada');
  const dialogTitulo = document.getElementById('fotoTitulo');
  const fecharFoto = document.getElementById('fecharFoto');
  const fotoAnterior = document.getElementById('fotoAnterior');
  const proximaFoto = document.getElementById('proximaFoto');
  let fotoAtual = 0;

  // Capítulos fotográficos: títulos, imagens e legendas vêm da galeria
  // original. O arquivo memorias.js registra apenas datas e relatos
  // OPCIONAIS. Isso impede que uma foto receba uma história inventada.
  const listaCapitulos = document.getElementById('listaCapitulos');

  function dataDaMemoria(iso) {
    if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      return 'Data não informada';
    }
    const [ano, mes, dia] = iso.split('-').map(Number);
    const data = new Date(ano, mes - 1, dia);
    if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
      return 'Data não informada';
    }
    return data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function renderizarCapitulos() {
    if (!listaCapitulos || !Array.isArray(window.albumMemorias)) return;
    const capitulos = [];

    window.albumMemorias.forEach((memoria, indice) => {
      if (!Number.isInteger(memoria.fotoIndice) || !fotos[memoria.fotoIndice]) return;
      const imagemGaleria = fotos[memoria.fotoIndice].querySelector('img');
      const legenda = fotos[memoria.fotoIndice].querySelector('.memory-caption')?.textContent?.trim();
      if (!imagemGaleria || !legenda) return;

      const capitulo = document.createElement('article');
      capitulo.className = 'chapter-card';

      const botaoFoto = document.createElement('button');
      botaoFoto.type = 'button';
      botaoFoto.className = 'chapter-photo';
      botaoFoto.setAttribute('aria-label', 'Ampliar fotografia: ' + legenda);
      const imagem = document.createElement('img');
      imagem.src = imagemGaleria.getAttribute('src');
      imagem.alt = imagemGaleria.alt;
      imagem.loading = 'lazy';
      imagem.decoding = 'async';
      botaoFoto.append(imagem);
      botaoFoto.addEventListener('click', () => abrirFoto(memoria.fotoIndice));

      const info = document.createElement('div');
      info.className = 'chapter-info';
      const numero = document.createElement('span');
      numero.className = 'chapter-ordinal';
      numero.textContent = 'Fotografia ' + String(indice + 1).padStart(2, '0');

      const titulo = document.createElement('h4');
      titulo.textContent = legenda;
      const data = document.createElement('p');
      data.className = 'chapter-meta';
      data.textContent = dataDaMemoria(memoria.data);

      const relato = document.createElement('p');
      relato.className = 'chapter-text';
      relato.textContent = typeof memoria.relato === 'string' && memoria.relato.trim()
        ? memoria.relato.trim()
        : 'Relato ainda não registrado.';

      info.append(numero, titulo, data, relato);
      capitulo.append(botaoFoto, info);
      capitulos.push(capitulo);
    });
    if (capitulos.length) listaCapitulos.replaceChildren(...capitulos);
  }

  renderizarCapitulos();

  function exibirFoto(indice) {
    if (!fotos.length) return;
    fotoAtual = (indice + fotos.length) % fotos.length;
    const botao = fotos[fotoAtual];
    const imagem = botao.querySelector('img');
    const legenda = botao.querySelector('.memory-caption');

    dialogImg.src = imagem.currentSrc || imagem.src;
    dialogImg.alt = imagem.alt;
    dialogTitulo.textContent = legenda.textContent;
  }

  function abrirFoto(indice) {
    exibirFoto(indice);
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
    fecharFoto.focus();
  }

  function fecharGaleria() {
    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
    fotos[fotoAtual]?.focus();
  }

  fotos.forEach((botao, indice) => botao.addEventListener('click', () => abrirFoto(indice)));
  fecharFoto.addEventListener('click', fecharGaleria);
  fotoAnterior.addEventListener('click', () => exibirFoto(fotoAtual - 1));
  proximaFoto.addEventListener('click', () => exibirFoto(fotoAtual + 1));
  dialog.addEventListener('click', event => {
    if (event.target === dialog) fecharGaleria();
  });
  document.addEventListener('keydown', event => {
    if (!dialog.open) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); exibirFoto(fotoAtual + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); exibirFoto(fotoAtual - 1); }
    if (event.key === 'Escape') {
      // O <dialog> também aceita Esc nativamente, mas este caminho
      // garante o mesmo fechamento no fallback sem showModal().
      if (typeof dialog.close !== 'function') fecharGaleria();
    }
  });

  // Contador a partir da data original do relacionamento.
  // Setembro = 8 no objeto Date (janeiro = 0).
  const dataInicio = new Date(2026, 8, 29, 20, 33, 0);
  const camposTempo = {
    anos: document.getElementById('tempoAnos'),
    meses: document.getElementById('tempoMeses'),
    dias: document.getElementById('tempoDias'),
    horas: document.getElementById('tempoHoras'),
    minutos: document.getElementById('tempoMinutos'),
    segundos: document.getElementById('tempoSegundos')
  };

  function aniversarioAposMeses(data, meses) {
    const aniversario = new Date(
      data.getFullYear(), data.getMonth() + meses, 1,
      data.getHours(), data.getMinutes(), data.getSeconds()
    );
    const ultimoDiaMes = new Date(
      aniversario.getFullYear(), aniversario.getMonth() + 1, 0
    ).getDate();
    aniversario.setDate(Math.min(data.getDate(), ultimoDiaMes));
    return aniversario;
  }

  // Próximo aniversário mensal, calculado pela mesma data e fuso do cronômetro.
  function nomeDoMarco(totalMeses) {
    const anos = Math.floor(totalMeses / 12);
    const meses = totalMeses % 12;
    const partes = [];
    if (anos) partes.push(anos + (anos === 1 ? ' ano' : ' anos'));
    if (meses) partes.push(meses + (meses === 1 ? ' mês' : ' meses'));
    return partes.join(' e ');
  }

  function atualizarProximaComemoracao(agora, totalMeses) {
    const proximoMes = totalMeses + 1;
    const proximaData = aniversarioAposMeses(dataInicio, proximoMes);
    // Diferença em dias de calendário, sem depender da duração de dias com horário de verão.
    const hojeUTC = Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const proximoUTC = Date.UTC(proximaData.getFullYear(), proximaData.getMonth(), proximaData.getDate());
    const diasRestantes = Math.max(0, Math.round((proximoUTC - hojeUTC) / 86400000));
    const textoFaltam = diasRestantes === 0
      ? 'É hoje! ♡'
      : diasRestantes === 1 ? 'Falta 1 dia' : 'Faltam ' + diasRestantes + ' dias';

    document.getElementById('proximoMarco').textContent = nomeDoMarco(proximoMes);
    document.getElementById('faltamDias').textContent = textoFaltam;
    document.getElementById('proximaComemoracaoData').textContent =
      proximaData.toLocaleDateString('pt-BR', {
        day: 'numeric', month: 'long', year: 'numeric'
      }) + ' às ' + proximaData.toLocaleTimeString('pt-BR', {
        hour: '2-digit', minute: '2-digit', hour12: false
      });
  }

  function atualizarCronometro() {
    const agora = new Date();
    let totalMeses = Math.max(
      0,
      (agora.getFullYear() - dataInicio.getFullYear()) * 12
        + agora.getMonth() - dataInicio.getMonth()
    );
    if (aniversarioAposMeses(dataInicio, totalMeses) > agora) {
      totalMeses = Math.max(0, totalMeses - 1);
    }

    const marco = aniversarioAposMeses(dataInicio, totalMeses);
    let restante = Math.max(0, agora - marco);
    const dias = Math.floor(restante / 86400000);
    restante %= 86400000;
    const horas = Math.floor(restante / 3600000);
    restante %= 3600000;

    camposTempo.anos.textContent = Math.floor(totalMeses / 12);
    camposTempo.meses.textContent = totalMeses % 12;
    camposTempo.dias.textContent = dias;
    camposTempo.horas.textContent = horas;
    camposTempo.minutos.textContent = Math.floor(restante / 60000);
    camposTempo.segundos.textContent = Math.floor(restante % 60000 / 1000);
    atualizarProximaComemoracao(agora, totalMeses);
  }

  atualizarCronometro();
  window.setInterval(atualizarCronometro, 1000);

  // Brincadeira original do botão "Não", com limites para celular e desktop.
  const btnSim = document.getElementById('btnSim');
  const btnNao = document.getElementById('btnNao');
  const telaPergunta = document.getElementById('telaPergunta');
  const respostaSim = document.getElementById('respostaSim');
  const recomeçar = document.getElementById('recomecar');
  const tituloResposta = document.getElementById('tituloResposta');

  const frasesNao = [
    'Não 🙄', 'Certeza?', 'Pensa bem...', 'Vai dar ruim!',
    'Clica no verde vai!', 'Errou feio!', 'Tenta de novo kkkk',
    'Tá negando o invicto?', 'Não fuja do amor!',
    'O verde tá brilhando ali ó 👀', 'Eu te amo, aperta no verde pfvr'
  ];
  let indiceFrase = 0;
  let tamanhoSim = 1;

  function posicionarNao(aleatorio = true) {
    const margem = 12;
    btnNao.style.position = 'fixed';
    const larguraDisponivel = Math.max(0, window.innerWidth - btnNao.offsetWidth);
    const alturaDisponivel = Math.max(0, window.innerHeight - btnNao.offsetHeight);
    const minX = Math.min(margem, larguraDisponivel);
    const minY = Math.min(margem, alturaDisponivel);
    const maxX = Math.max(minX, larguraDisponivel - margem);
    const maxY = Math.max(minY, alturaDisponivel - margem);
    const xAtual = Number.parseFloat(btnNao.style.left) || minX;
    const yAtual = Number.parseFloat(btnNao.style.top) || minY;
    const x = aleatorio ? minX + Math.random() * (maxX - minX) : Math.min(maxX, Math.max(minX, xAtual));
    const y = aleatorio ? minY + Math.random() * (maxY - minY) : Math.min(maxY, Math.max(minY, yAtual));

    btnNao.style.left = x + 'px';
    btnNao.style.top = y + 'px';
  }

  function fugirNao() {
    indiceFrase = (indiceFrase + 1) % frasesNao.length;
    btnNao.textContent = frasesNao[indiceFrase];
    posicionarNao();
    tamanhoSim = Math.min(1.45, tamanhoSim + .12);
    btnSim.style.transform = 'scale(' + tamanhoSim + ')';
  }

  btnNao.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse' && !telaPergunta.hidden) fugirNao();
  });
  btnNao.addEventListener('click', fugirNao);
  window.addEventListener('resize', () => {
    if (btnNao.style.position === 'fixed') posicionarNao(false);
  });

  btnSim.addEventListener('click', () => {
    telaPergunta.hidden = true;
    respostaSim.hidden = false;
    btnNao.style.position = '';
    btnNao.style.left = '';
    btnNao.style.top = '';
    tituloResposta.focus();
  });

  recomeçar.addEventListener('click', () => {
    tamanhoSim = 1;
    btnSim.style.transform = '';
    indiceFrase = 0;
    btnNao.textContent = frasesNao[0];
    btnNao.style.position = '';
    btnNao.style.left = '';
    btnNao.style.top = '';
    respostaSim.hidden = true;
    telaPergunta.hidden = false;
    btnSim.focus();
  });
})();
