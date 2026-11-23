# Nossa História Infinita ❤️

Um álbum de memórias romântico, com visual de livro e conteúdo real. Feito com HTML, CSS e JavaScript, sem instalar dependências.

## Upgrade completo — Etapa 1: editor de memórias

A seção **Editar memórias** permite atualizar **legendas, datas, relatos e links das fotografias** ou adicionar uma foto por **link HTTPS direto** ou caminho de uma imagem **já enviada à pasta `fotos/`**. O site não faz upload de arquivos do celular.

**Salvar neste aparelho** usa armazenamento local do navegador: as mudanças **não** são enviadas ao GitHub, **não** aparecem em outros aparelhos e podem ser acessadas por outras pessoas que utilizam o mesmo navegador. Para publicar, salve primeiro e clique em **Baixar memorias.js**; substitua esse arquivo no GitHub e aguarde a atualização do GitHub Pages. O botão **Descartar minhas alterações locais** restaura a visualização dos dados publicados, sem alterar o repositório.

As fotos e mensagens publicadas continuam no app. Novas imagens e relatos enviados ao repositório público também ficam públicos, então confira antes de publicar.

O plano das próximas etapas está em [ROADMAP.md](ROADMAP.md).

## O que há no aplicativo

- **Início:** capa e apresentação do álbum, com as fotos originais.
- **Nossa história:** data confirmada do início do namoro, em **29/09/2026 às 20h33**.
- **Capítulos do álbum:** capa de livro e cinco capítulos fotográficos baseados nas **fotos e legendas que já existiam**. A ordem é a da galeria, **não** uma cronologia inventada.
- **Cartinha:** envelope interativo com a declaração original.
- **Galeria:** cinco fotografias em cartões Polaroid, ampliáveis e sem corte.
- **Nosso tempo:** cronômetro desde o começo do namoro e contagem para o próximo aniversário mensal.
- **Surpresa:** brincadeira original dos botões “Sim” e “Não”.

## Organização dos arquivos

- `index.html`: estrutura, textos, links e legendas das fotos.
- `styles.css`: aparência delicada, livro, responsividade e acessibilidade.
- `memorias.js`: dados publicados, incluindo datas, relatos e, opcionalmente, legenda e endereço para imagens adicionais. As fotos 1 e 2 têm datas e relatos; as outras três permanecem sem esses detalhes.
- `album-data.js`: sincroniza a configuração publicada com edições salvas apenas no navegador e prepara a galeria.
- `editor.js`: formulário acessível, exportação de `memorias.js` e opção para limpar alterações locais.
- `app.js`: capítulos, galeria ampliada, cronômetros e surpresa.

Abra o `index.html` no navegador ou publique os arquivos juntos no GitHub Pages. Os scripts `memorias.js` e `app.js` precisam estar na mesma pasta.

## Como adicionar histórias reais às fotos

As cinco imagens originais e suas legendas continuam definidas no `index.html`. Em `memorias.js`, o campo `fotoIndice` identifica as fotos de `0` a `4`. As imagens adicionadas depois podem usar `fotoIndice: 5`, `src` e `legenda`. O `album-data.js` inclui essas fotos no álbum antes da inicialização do app. Use índices sequenciais e fotos acessíveis por HTTPS ou pela pasta `fotos/`.

Exemplo de **formato** (não é um acontecimento nem uma data real):

```js
{ fotoIndice: 0, data: 'AAAA-MM-DD', relato: 'Escreva aqui o que aconteceu de verdade.' }
```

Se a data ou o relato não forem conhecidos, deixe `data: null` e `relato: ''`. O aplicativo mostrará **“Data não informada”** e **“Relato ainda não registrado”**. Dados preenchidos aparecem nos capítulos, nos cartões da galeria e ao ampliar as fotos. Isso evita atribuir histórias falsas às fotos.

## Como personalizar

- **Data do namoro:** a constante `dataInicio` em `app.js` está em `new Date(2026, 8, 29, 20, 33, 0)` (em JavaScript, setembro é o mês `8`).
- **Fotos:** use o editor ou altere os registros em `memorias.js` para atualizar o álbum. O HTML mantém as cinco imagens originais como alternativa inicial.
- **Declarações:** altere os textos apenas se desejar, nas seções `#cartinha` e `#tempo`.
- **Frases do botão “Não”:** altere `frasesNao` em `app.js`.
- **Design:** personalize cores e fontes nas variáveis `:root` de `styles.css`.

## Observações

- A contagem do tempo e as comemorações utilizam o relógio e fuso horário local do dispositivo. Não há sincronização entre dispositivos.
- As três fotografias originais continuam hospedadas no Imgur. Caso os links parem de funcionar, coloque os arquivos no repositório e substitua os caminhos. O repositório é público: confirme a privacidade de qualquer nova foto ou lembrança antes de enviá-la.
- Google Fonts é opcional; há fontes alternativas caso não carregue.
- A galeria pode ser fechada pelo botão de fechar ou pela tecla Esc, e as setas do teclado passam entre as fotos.
- O editor só armazena texto e links de imagem; não faz upload, não protege fotos com senha e não sincroniza alterações automaticamente. O armazenamento local pode ser apagado pelas configurações do navegador.

## Novas fotografias

- `fotos/lembranca-04.webp` e `fotos/lembranca-05.webp`: recortes fiéis das duas imagens enviadas, mantendo apenas uma das duas cópias idênticas de cada foto.
- O álbum agora contém **cinco fotografias**, com as três originais preservadas e duas imagens locais novas.
- As fotos 4 e 5 aparecem na galeria ampliável e nos capítulos; como não foram fornecidas datas ou histórias para elas, esses campos permanecem vazios.
- Essas imagens ficam no repositório público junto do aplicativo.
