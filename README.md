# Nossa História Infinita ❤️

Um álbum de memórias romântico, com visual de livro e conteúdo real. Feito com HTML, CSS e JavaScript, sem dependências na página.

## Sincronização Supabase sem login e sem código

**Status:** backend e site sem código já estão na versão principal. O **modo Realtime** está preparado nesta branch de revisão e será disponibilizado no site após a publicação do Pull Request correspondente.

**Proteção contra excesso de uso:** até 30 edições a cada 15 minutos, 4 fotos por hora e 8 fotos por 24 horas, para todos os visitantes somados. Faça backups JSON e guarde os originais das imagens fora do site.

O projeto Supabase **App do Meu Amor** (`jfedjtdyjpvqzetlexuf`) está ativo em São Paulo, com banco, Storage e função `album-sync` configurados. A URL e a chave **publishable** (que não é secreta) estão em `cloud-config.js`. Consulte **[SUPABASE-SETUP.md](SUPABASE-SETUP.md)** para os detalhes.

- **Visualizar:** qualquer pessoa com o endereço do site pode ver as memórias.
- **Editar:** qualquer visitante poderá salvar fotos, datas, relatos, bilhetes e sonhos sem login e sem código. **Isso permite edições indesejadas por desconhecidos.**
- **Sincronizar em tempo real (novo):** o Supabase emite um sinal de versão ao salvar fotos, relatos, bilhetes, música ou sonhos. Com o app aberto e sem edição em andamento, outro celular busca os dados e atualiza automaticamente. Se houver texto sendo editado, aparece um aviso com botão de atualização. Sem conexão Realtime, o app verifica novidades a cada 60 segundos.
- **Enviar fotos:** com a nuvem ativa, é possível escolher JPG, PNG ou WebP de até 5 MB diretamente no celular. As imagens vão para um bucket **público**.
- **Sem nuvem:** o editor continua funcionando localmente, com exportação manual de arquivos.
- **Sem autenticação de contas:** não há área privada de leitura. A RLS impede acesso direto às tabelas, mas a Edge Function disponibiliza leitura pública por decisão do produto. **Não publique informações pessoais que devam ficar secretas.**

Arquivos da integração: `cloud-config.js`, `cloud-bootstrap.js`, `supabase/functions/album-sync/index.ts`, `supabase/migrations/202611230001_album_publico_sem_login.sql`, `supabase/migrations/202611230002_limites_edicao_publica.sql` e `SUPABASE-SETUP.md`. **Não publique chaves secretas do servidor.**

### Como funciona o tempo real

A migração `supabase/migrations/202611230003_sinal_realtime_album.sql` cria a tabela `amor_sinal` e os dois gatilhos. O canal público de Realtime recebe **somente um número de versão**, sem transmitir memórias ou imagens. O app então busca os dados na função `album-sync`.

O cliente usa `@supabase/supabase-js@2.86.0` por CDN para assinar mudanças. Se o CDN ou o canal falhar, a visualização não para de funcionar: continua a conferência a cada 60 segundos. A atualização automática recarrega a página preservando a posição de leitura; durante a digitação, oferece atualização manual para não perder o conteúdo ainda não salvo. **O site continua público para leitura e edição, sem login nem código.**

## Upgrade completo — Etapa 1: editor de memórias

A seção **Editar memórias** permite atualizar legendas, datas, relatos e links das fotografias. Com Supabase configurado, também envia fotos diretamente do celular (JPG, PNG ou WebP, até 5 MB). Sem nuvem, aceita somente URLs HTTPS ou arquivos já presentes em `fotos/`.

**Salvar** envia alterações à nuvem quando ela está ativa, sem login e sem código de edição. No modo local, guarda apenas no navegador e oferece o download de `memorias.js` para publicação manual. O botão **Descartar minhas alterações locais** funciona somente no modo local.

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

Com o Supabase conectado, as alterações feitas no editor e nas surpresas ficam disponíveis aos visitantes e entre aparelhos, sem autorização para editar. Sem nuvem, continuam locais. O repositório permanece público, assim como a leitura de dados do endpoint. **Não existe proteção privada de acesso às fotos publicadas.** Consulte [ROADMAP.md](ROADMAP.md) para os detalhes.

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
- `cloud-bootstrap.js`: carrega dados da nuvem antes de renderizar a galeria e envia gravações sem exigir código.
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
- Sem Supabase, o editor guarda somente texto e links no armazenamento local, sujeito à limpeza do navegador. Com Supabase, envia imagens à nuvem, mas **tanto a leitura quanto a edição ficam públicas**. Limites globais de gravação reduzem abuso, mas não protegem as lembranças contra vandalismo.

## Novas fotografias

- `fotos/lembranca-04.webp` e `fotos/lembranca-05.webp`: recortes fiéis das duas imagens enviadas, mantendo apenas uma das duas cópias idênticas de cada foto.
- O álbum agora contém **cinco fotografias**, com as três originais preservadas e duas imagens locais novas.
- As fotos 4 e 5 aparecem na galeria ampliável e nos capítulos; como não foram fornecidas datas ou histórias para elas, esses campos permanecem vazios.
- Essas imagens ficam no repositório público junto do aplicativo.
