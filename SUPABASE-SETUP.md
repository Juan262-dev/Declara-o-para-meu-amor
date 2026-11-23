# Supabase sem login — integração do App do Meu Amor

## Configuração atual (23/11/2026)

- Organização: **App do meu amor**
- Projeto: **App do Meu Amor** (`jfedjtdyjpvqzetlexuf`)
- Região: **São Paulo, Brasil** (`sa-east-1`)
- URL: `https://jfedjtdyjpvqzetlexuf.supabase.co`
- Banco e armazenamento: **criados**, com as 5 fotos originais e os 2 relatos informados.
- Edge Function `album-sync`: **publicada**, com `verify_jwt=false` (sem login).
- Código forte de edição: **configurado no banco como hash SHA-256**, nunca armazenado em texto aberto no GitHub.
- `cloud-config.js`: configurado com a URL do projeto.
- **GitHub Pages:** mudanças ainda numa branch e PR #8, aguardando merge/autorização para publicação.
- Teste de ponta a ponta do endpoint no navegador real: pendente.

## Como funciona

O álbum não exige login e **as lembranças são públicas para visualização**. Os dados são carregados pela Edge Function por HTTPS.

Para editar fotos, datas, relatos, música, bilhetes ou sonhos, o aplicativo pede **um código de edição longo**. Esse código é verificado na Edge Function comparando seu hash SHA-256 ao valor armazenado em `public.amor_edicao`. A chave secreta do Supabase existe apenas no ambiente de execução da função.

### Quem pode acessar?

- **Ler:** qualquer pessoa com o link do álbum.
- **Editar:** qualquer pessoa que saiba o código de edição.
- **Enviar fotos:** quem souber o código de edição, usando JPG, PNG ou WebP com até 5 MB.
- **Onde ficam as fotos:** bucket Supabase **público** `amor-fotos-publicas` (nunca trate como armazenamento privado).

## Segurança

As tabelas `amor_memorias`, `amor_extras` e `amor_edicao` têm RLS ativada e não oferecem acesso direto a papéis `anon`/`authenticated`. Isso significa que todo o tráfego esperado passa pela Edge Function, cuja leitura é pública e cuja gravação exige o código.

O linter do Supabase pode apresentar `RLS Enabled No Policy`; isso é **intencional** porque nenhum visitante deve acessar as tabelas diretamente. A função usa uma chave de servidor injetada no ambiente pelo Supabase. **Nunca coloque essa chave no GitHub ou no navegador.**

O código de edição tem 48 caracteres gerados aleatoriamente. A chave em texto aberto foi entregue diretamente ao responsável pelo álbum; **não** está neste repositório. Para alterá-la, gere uma nova sequência aleatória forte, calcule seu SHA-256 e atualize apenas o campo `codigo_hash` da linha `id=1` em `public.amor_edicao`. Não use PIN curto ou aniversário.

## Arquivos da integração

- `cloud-config.js`: URL pública do projeto.
- `cloud-bootstrap.js`: carrega os dados remotos antes de iniciar a galeria.
- `supabase/migrations/202611230001_album_publico_sem_login.sql`: esquema e dados iniciais, com inserções que não sobrescrevem memórias existentes.
- `supabase/functions/album-sync/index.ts`: backend de leitura, edição e upload com código.
- `supabase/config.toml`: configuração de função pública sem login.
- `SUPABASE-SETUP.md`: este documento.

## Antes e depois do merge

A versão principal `main` não foi alterada pela configuração do Supabase. O PR #8 aplica as modificações de site e conecta a URL; o backend já foi criado no projeto Supabase.

Depois do merge, verifique o aviso `Lembranças sincronizadas` no topo do site. Salvar uma memória envia uma gravação ao Supabase; no outro dispositivo, recarregue a página (ou use o aviso de atualização).

O código de edição não é pedido para **ver** o álbum. Ele é solicitado apenas ao clicar em **Salvar**, e permanece na memória da página até que ela seja fechada ou atualizada.

## Cuidados com lembranças antigas

As cinco fotos e os relatos já publicados no GitHub foram inseridos no banco sem substituição de registros existentes. Se houver **alterações feitas somente no navegador antigo**, elas não são migradas automaticamente: faça um backup dessas edições antes de passar ao modo nuvem.

Backups JSON armazenam **links e informações**, não o conteúdo binário das fotografias. Para manter cópias de fotos, guarde também os arquivos de imagem separadamente.

## Limitações

- Sem login, **não existe privacidade de leitura**. Imagens e relatos enviados à nuvem tornam-se públicos.
- Não há histórico de versões nem distinção entre pessoas que possuem o mesmo código.
- Se o código vazar, altere o hash cadastrado no banco.
- Uma restauração de backup na nuvem é sequencial e pode ser parcial se houver falha na conexão.
- A criação do projeto teve custo informado de US$ 0/mês, mas o uso e o armazenamento obedecem aos limites e preços do plano Supabase.
- Testes funcionais automatizados não substituem uma conferência visual e uma chamada HTTP real ao serviço.
