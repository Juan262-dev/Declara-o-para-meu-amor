# Nossa História Infinita ❤️

Um álbum de memórias romântico, com visual de livro e conteúdo real. Feito com HTML, CSS e JavaScript, sem dependências na página.

## Sincronização Supabase SEM LOGIN (nova integração)

A integração com Supabase está **preparada no código**, mas **ainda não foi ativada**, porque a organização Supabase conectada não tinha nenhum projeto de banco disponível. Consulte **[SUPABASE-SETUP.md](SUPABASE-SETUP.md)** para ativar.

- **Visualizar:** qualquer pessoa com o endereço do site pode ver as memórias.
- **Editar:** o aplicativo pede um código longo somente quando alguém tenta alterar dados. O código é verificado na Edge Function, nunca fica no GitHub.
- **Sincronizar:** quando o Supabase estiver ativo, salvar uma memória, bilhete, música ou sonho envia a alteração à nuvem. Outros celulares veem a nova versão ao abrir/atualizar a página e recebem um aviso se surgirem novidades.
- **Enviar fotos:** com a nuvem ativa, é possível escolher JPG, PNG ou WebP de até 5 MB diretamente no celular. As imagens vão para um bucket **público**.
- **Sem nuvem:** o editor continua funcionando localmente, com exportação manual de arquivos.
- **Sem autenticação de contas:** não há área privada de leitura. A RLS impede acesso direto às tabelas, mas a Edge Function disponibiliza leitura pública por decisão do produto. **Não publique informações pessoais que devam ficar secretas.**

Arquivos novos: `cloud-config.js`, `cloud-bootstrap.js`, `supabase/functions/album-sync/index.ts`, `supabase/migrations/202611230001_album_publico_sem_login.sql` e `SUPABASE-SETUP.md`. **Não publique o código de edição nem chaves de servidor.**

## Upgrade completo — Etapa 1: editor de memórias

A seção **Editar memórias** permite atualizar legendas, datas, relatos e links das fotografias. Com Supabase configurado, também envia fotos diretamente do celular (JPG, PNG ou WebP, até 5 MB). Sem nuvem, aceita somente URLs HTTPS ou arquivos já presentes em `fotos/`.

**Salvar** envia alterações à nuvem quando ela está ativa e pede um código longo para editar, sem exigir login. No modo local, guarda apenas no navegador e oferece o download de `memorias.js` para publicação manual. O botão **Descartar minhas alterações locais** funciona somente no modo local.

As fotos e mensagens publicadas continuam no app. Novas imagens e relatos enviados ao repositório público também ficam públicos, então confira antes de publicar.

O plano das próximas etapas está em [ROADMAP.md](ROADMAP.md).

## Upgrade completo — etapas 2, 3 e 4

A branch de revisão também inclui:

- **Livro navegável:** botões para avançar ou voltar um capítulo com transições suaves e indicador de página, respeitando preferência por movimento reduzido.
- **Pote de bilhetinhos:** sorteia frases do álbum e aceita novas mensagens, que podem ser sincronizadas na nuvem.
- **Comemoração mensal:** cartão especial que aparece no dia 29 a partir do início do namoro.
- **Música do casal:** campo para nome e link HTTPS externo, sem cópia/reprodução da música no próprio app.
- **Sonhos:** lista de coisas a realizar com checkboxes para acompanhar, adicionar e remover; salva somente no navegador.
- **Backup:** exportação de um arquivo JSON com fotos (links e legendas), datas, relatos, bilhetes, música e sonhos. As imagens em si não são incorporadas ao backup.
- **Restauração:** opção para importar o JSON e repor dados locais ou enviar as memórias à nuvem (quando configurada) após confirmação.
- **Publicação consciente:** botão para baixar `memorias.js` e `surpresas-data.js`, desbloqueado só depois de confirmar que o repositório é público. A substituição no GitHub é **manual**.

Quando o Supabase estiver configurado, as alterações feitas no editor e nas surpresas ficam disponíveis aos visitantes e entre aparelhos, mediante o código de edição para salvar. Sem nuvem, continuam locais. O repositório permanece público, assim como a leitura de dados do endpoint. **Não existe proteção privada de acesso às fotos publicadas.** Consulte [ROADMAP.md](ROADMAP.md) para os detalhes.

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
- `cloud-config.js`: URL pública do projeto Supabase (sem segredos).
- `cloud-bootstrap.js`: carrega dados da nuvem antes de renderizar a galeria e prepara a gravação protegida.
- `album-data.js`: prepara a galeria, usando dados remotos no modo nuvem ou edições locais no modo sem nuvem.
- `editor.js`: formulário acessível, exportação de `memorias.js` e opção para limpar alterações locais.
- `surpresas-data.js`: bilhetes do álbum e conteúdo público configurável de música e sonhos.
- `experiencias.js`: navegação pelas páginas, bilhetes, data especial, música e lista de sonhos.
- `privacidade.js`: exportação de backup, importação validada e publicação manual consciente.
- `app.js`: capítulos, galeria ampliada, cronômetros e surpresa.

Publique os arquivos juntos no GitHub Pages. O `cloud-bootstrap.js` carrega os outros scripts na ordem correta depois de tentar obter os dados no Supabase. Para usar a nuvem, é necessário que a função e o banco já estejam configurados conforme `SUPABASE-SETUP.md`.

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

- A contagem do tempo e as comemorações utilizam o relógio e fuso horário local do dispositivo. As memórias e surpresas são sincronizadas entre dispositivos apenas quando o Supabase estiver ativo.
- As três fotografias originais continuam hospedadas no Imgur. Caso os links parem de funcionar, coloque os arquivos no repositório e substitua os caminhos. O repositório é público: confirme a privacidade de qualquer nova foto ou lembrança antes de enviá-la.
- Google Fonts é opcional; há fontes alternativas caso não carregue.
- A galeria pode ser fechada pelo botão de fechar ou pela tecla Esc, e as setas do teclado passam entre as fotos.
- Sem Supabase, o editor guarda somente texto e links no armazenamento local, sujeito à limpeza do navegador. Com Supabase, envia imagens à nuvem, mas **a leitura continua pública** e alterações exigem um código longo.

## Novas fotografias

- `fotos/lembranca-04.webp` e `fotos/lembranca-05.webp`: recortes fiéis das duas imagens enviadas, mantendo apenas uma das duas cópias idênticas de cada foto.
- O álbum agora contém **cinco fotografias**, com as três originais preservadas e duas imagens locais novas.
- As fotos 4 e 5 aparecem na galeria ampliável e nos capítulos; como não foram fornecidas datas ou histórias para elas, esses campos permanecem vazios.
- Essas imagens ficam no repositório público junto do aplicativo.
