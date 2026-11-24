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

O site e a função de edição sem código já foram publicados. A integração de notificações Realtime está preparada em uma nova branch de revisão, aguardando integração ao site.

## Como a segurança funciona agora

- A leitura e a escrita são públicas por meio da **Edge Function**, mas as tabelas do banco de dados **não** concedem operações diretas a `anon` ou `authenticated`.
- A função confere formato das datas, textos, links, imagens e limites de tamanho antes de gravar.
- A função usa uma chave de servidor injetada pelo Supabase: **nunca colocar chave secret ou service_role no GitHub nem no JavaScript do site**.
- A função executa a RPC `amor_reservar_edicao` com papéis de servidor. A RPC não é executável pelo papel `anon`.
- Limites **globais**, para todos os visitantes somados: até **30 edições a cada 15 minutos**, até **4 imagens por hora** e até **8 imagens por período de 24 horas**. Após atingir algum limite, o servidor responde HTTP 429. Isso reduz abusos, mas **não impede vandalismo ou acesso por scripts**.
- A tabela antiga `amor_edicao` ainda armazena o hash do código de edição para eventual reversão. O novo endpoint não o consulta nem exige código.

## Como publicar sem interromper o site

1. Verificar arquivos e fazer o merge do Pull Request correspondente na `main` somente com aprovação.
2. Publicar a versão nova de `supabase/functions/album-sync/index.ts`, usando `verify_jwt = false`.
3. Aguardar a atualização do GitHub Pages e testar o editor no celular e em outro dispositivo.
4. Verificar que nenhum código é solicitado e que a limitação de uso funciona.

A migração da limitação já foi aplicada, o que não alterou a proteção por código da função que continua em produção.

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

Na branch do site, `cloud-config.js` usa apenas a **chave publishable** pública, nunca um segredo do servidor. `cloud-bootstrap.js` carrega a versão fixada de `@supabase/supabase-js@2.86.0` por CDN e assina `postgres_changes` da tabela `amor_sinal`.

Quando uma edição é salva em outro aparelho, o navegador busca novamente os registros por HTTPS pela Edge Function `album-sync`, em vez de aceitar o conteúdo do evento. Se o visitante não está escrevendo, a página recarrega automaticamente preservando a posição; se está editando, surge um aviso para atualizar depois de salvar. Em caso de CDN indisponível, queda do websocket ou suspensão do celular, a conferência de novidades a cada 60 segundos e ao voltar à aba continua disponível.

**A edição permanece aberta para qualquer pessoa, sem login nem código.** O Realtime não protege as memórias contra alterações indevidas. Guarde backups.

Verificação no banco: publicação habilitada, dois gatilhos instalados, leitura anônima permitida somente para a tabela de sinal e atualização anônima proibida. Teste transacional dos dois gatilhos passou com rollback, sem alterar as fotos ou os relatos.
