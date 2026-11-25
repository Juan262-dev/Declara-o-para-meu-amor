# Integração Supabase — App do Meu Amor (sem login e sem código de edição)

## Ambiente já configurado

- Projeto: **App do Meu Amor**, Supabase `jfedjtdyjpvqzetlexuf`, região São Paulo.
- URL pública da API: `https://jfedjtdyjpvqzetlexuf.supabase.co`.
- PostgreSQL com as cinco fotografias originais e dois relatos com datas.
- Edge Function `album-sync`, configurada com `verify_jwt = false`.
- Bucket `amor-fotos-publicas` para arquivos JPG, PNG e WebP de até 5 MB.
- Migração `album_publico_sem_login` instalada.
- Migração `limites_edicao_publica` instalada para conter parte dos abusos.

## Acesso do álbum

**Nenhum visitante precisa de login, senha ou código para ler ou editar.** Qualquer pessoa que conseguir abrir o site poderá adicionar e alterar fotos, legendas, datas, relatos, bilhetes, o link da música e os sonhos. Quem alterar uma lembrança estará alterando a versão que todos veem. Isso foi solicitado explicitamente pelo responsável pelo álbum.

O site, a função sem código e a integração Realtime estão na branch `main`, após os PRs #9 e #10. A correção de rascunhos garante que uma edição não salva não seja descartada automaticamente.

## Como a segurança funciona agora

- A leitura e a escrita são públicas por meio da **Edge Function**, mas as tabelas do banco de dados **não** concedem operações diretas a `anon` ou `authenticated`.
- A função confere formato das datas, textos, links, imagens e limites de tamanho antes de gravar.
- A função usa uma chave de servidor injetada pelo Supabase: **nunca colocar chave secret ou service_role no GitHub nem no JavaScript do site**.
- A função executa a RPC `amor_reservar_edicao` com papéis de servidor. A RPC não é executável pelo papel `anon`.
- Limites **globais**, para todos os visitantes somados: até **30 edições a cada 15 minutos**, até **4 imagens por hora** e até **8 imagens por período de 24 horas**. Após atingir algum limite, o servidor responde HTTP 429. Isso reduz abusos, mas **não impede vandalismo ou acesso por scripts**.
- A tabela antiga `amor_edicao` ainda armazena o hash do código de edição para eventual reversão. O novo endpoint não o consulta nem exige código.

## Como conferir o site

1. Abra o álbum em dois celulares ou duas abas distintas.
2. Salve um bilhete, sonho ou relato em um deles. No outro, com o formulário fechado e sem rascunhos pendentes, a página deve buscar a nova versão e se atualizar automaticamente.
3. Faça uma alteração em um campo sem salvá-la. Novas mudanças remotas devem aparecer como aviso, sem recarregar e perder o texto.
4. Salve o rascunho: o aviso pendente poderá ser aplicado automaticamente. Se o tempo real cair, uma consulta a cada 60 segundos continua disponível.
5. Se algo falhar, confirme primeiro a conexão e as permissões de Realtime, depois teste atualizar a página manualmente.

## Regras de privacidade e recuperação

- **Álbum totalmente público:** qualquer pessoa com o link pode ver **e modificar** as memórias e surpresas.
- **Sem área privada:** não compartilhe histórias ou fotos que não deveriam estar visíveis.
- **Sem recuperação automática de versões:** faça backups JSON com frequência e guarde as fotos originais fora da nuvem.
- Uma pessoa que edita pode sobrescrever dados de outra. Atualize a página para ver a última versão.
- Se houver uso indevido, será necessário desativar temporariamente as gravações no servidor ou restaurar um backup.
- Os limites de uso não distinguem pessoas e podem impedir temporariamente edições legítimas se alguém consumir a cota.
- O repositório do GitHub e fotos já publicadas continuam acessíveis ao público.

## Arquivos

- `cloud-config.js`: URL pública, não contém segredos.
- `cloud-bootstrap.js`: cliente sem prompt de código.
- `supabase/functions/album-sync/index.ts`: função pública com validação e limite.
- `supabase/migrations/202611230002_limites_edicao_publica.sql`: proteção de abuso com função SQL `SECURITY INVOKER`.
- `README.md` e `ROADMAP.md`: comportamento e versões.


## Sincronização em tempo real (etapa 7)

A migração `supabase/migrations/202611230003_sinal_realtime_album.sql` foi aplicada no Supabase. Ela cria:

- `public.amor_sinal`: contém somente `id`, `versao` e `atualizado_em` (nenhum dado pessoal);
- dois gatilhos: qualquer INSERT/UPDATE/DELETE em `amor_memorias` ou `amor_extras` incrementa o número da versão;
- acesso anônimo **somente de leitura** a esse número, com RLS ativa;
- assinatura do sinal por `supabase_realtime`, sem publicar a tabela de fotos ou relatos.

No site publicado, `cloud-config.js` usa apenas a **chave publishable** pública, nunca um segredo do servidor. `cloud-bootstrap.js` carrega a versão fixada de `@supabase/supabase-js@2.86.0` por CDN e assina `postgres_changes` da tabela `amor_sinal`.

Quando uma edição é salva em outro aparelho, o navegador busca novamente os registros por HTTPS pela Edge Function `album-sync`, em vez de aceitar o conteúdo do evento. Se o visitante não está escrevendo, a página recarrega automaticamente preservando a posição; se tem alterações não salvas, surge um aviso para atualizar depois de salvar. Após o último formulário pendente ser salvo, o app volta a atualizar automaticamente. Em caso de CDN indisponível, queda do websocket ou suspensão do celular, a conferência de novidades a cada 60 segundos e ao voltar à aba continua disponível.

**A edição permanece aberta para qualquer pessoa, sem login nem código.** O Realtime não protege as memórias contra alterações indevidas. Guarde backups.

Verificação no banco: publicação habilitada, dois gatilhos instalados, leitura anônima permitida somente para a tabela de sinal e atualização anônima proibida. Teste transacional dos dois gatilhos passou com rollback, sem alterar as fotos ou os relatos.

## Histórico privado para recuperação

A migração `supabase/migrations/202611230004_historico_seguro.sql` foi aplicada ao projeto. Ela cria `public.amor_historico` com RLS ativa, sem permissão de acesso direto para `anon` e `authenticated`. A função-gatilho `amor_guardar_historico` registra o estado `OLD` antes de sobrescrever ou excluir dados das tabelas `amor_memorias` e `amor_extras`, retendo no máximo 200 registros históricos.

A migração criou seis cópias de base: as cinco memórias existentes e o registro das surpresas. Os gatilhos de ambas as tabelas foram testados dentro de uma transação revertida, sem alteração permanente nos dados do álbum.

**Restaurar:** somente alguém com acesso administrativo ao projeto Supabase deve escolher uma revisão, verificar o JSON da coluna `conteudo` e restaurar manualmente os campos válidos. Não há endpoint público para listar ou restaurar o histórico, pois qualquer visitante poderia explorar esse recurso. O histórico **não duplica** os bytes das fotografias: preserva links e dados antigos. Não publique o conteúdo histórico sem avaliar a privacidade.

## App no celular e fotos otimizadas

O site oferece `manifest.webmanifest`, ícone SVG, instalador e cache do shell por `sw.js`. A instalação depende do navegador. O cache exclui requisições ao Supabase e sites de terceiros. Sem rede, a edição remota não funciona; a página pode mostrar as cinco memórias publicadas como alternativa.

O `foto-otimizador.js` roda no celular antes do upload e reduz arquivos grandes com canvas, até 1800 px no maior lado, quando compatível. O limite de 5 MB do servidor, a validação MIME e o controle global de uploads permanecem iguais. O arquivo original não é modificado.


## Cartinhas por data e temas

A migração `202611250001_surpresas_programadas.sql` acrescenta `surpresas jsonb NOT NULL DEFAULT '[]'` à tabela `amor_extras`, sem apagar nem modificar `bilhetes`, `musica` ou `sonhos`. O campo armazena até 20 itens no formato:
`{ id, titulo, mensagem, data: "AAAA-MM-DD", anual: boolean }`.

A Edge Function `album-sync` valida o formato, os comprimentos e a data antes de gravar. A API continua sem login ou código; o histórico privado existente registra versões anteriores. A escrita feita por clientes antigos sem o campo `surpresas` preserva as cartinhas existentes.

A interface só revela a mensagem conforme a data no relógio local: cartinhas não anuais desde a data; anuais no dia/mês combinado a partir do ano escolhido. **Não é conteúdo secreto:** como o álbum é público, é possível ler ou modificar cartinhas pelo serviço sem aguardar a data.

Os temas ficam somente no `localStorage` do aparelho e não exigem novos privilégios no Supabase; os arquivos principais são `temas.js` e `styles.css`. O backup/exportação de surpresas inclui `surpresas`, e backups antigos não sobrescrevem a lista atual quando não trazem esse campo.
