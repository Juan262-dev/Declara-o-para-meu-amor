# Supabase sem login — instruções para ativar a sincronização

> **Estado:** código preparado no GitHub; a nuvem ainda não está ativa até que exista um projeto Supabase configurado. A integração ChatGPT–Supabase mostra a organização “App do meu amor”, mas não apresentou nenhum projeto de banco disponível no momento da implementação.

## Como fica o acesso

- **Ver fotos e lembranças:** qualquer visitante do site, sem login.
- **Adicionar/editar:** somente quem souber o **código longo de edição**, verificado na Edge Function.
- **Sincronização:** alterações salvas na nuvem aparecem quando outros dispositivos abrem/atualizam o álbum; o app verifica novidades a cada minuto e oferece botão para atualizar.
- **Fotos do celular:** upload direto de JPG, PNG ou WebP até 5 MB no Storage Supabase.
- **Privacidade:** **não há álbum privado**. Fotos e dados servidos pela API são públicos para leitura. Nunca use esse sistema para informações secretas.

## 1. Ter um projeto Supabase

No [Dashboard do Supabase](https://supabase.com/dashboard), verifique a organização **App do meu amor**. Se ainda não houver projeto, crie um nela. A criação pode consumir créditos ou gerar custos de acordo com o plano; revise o preço e peça autorização de quem administra a conta antes.

## 2. Banco de dados e fotos

Abra **SQL Editor** no projeto e execute o arquivo:
`supabase/migrations/202611230001_album_publico_sem_login.sql`.

Ele cria:
- `public.amor_memorias`: as cinco fotos originais com as datas e relatos já fornecidos;
- `public.amor_extras`: bilhetinhos, música e sonhos;
- `storage.buckets`: `amor-fotos-publicas`, bucket **público** para imagens;
- RLS ativa com acesso direto retirado de visitantes; todas as consultas passam pela Edge Function.

As linhas originais são inseridas apenas se ainda não existirem, para não substituir memórias posteriores.

## 3. Publicar a função

Implante `supabase/functions/album-sync/index.ts` como Edge Function chamada **album-sync**. O arquivo `supabase/config.toml` define `verify_jwt = false`; no Dashboard, confirme também que a exigência de JWT está desligada. Essa função faz leitura aberta, **mas verifica o código de edição no servidor antes de qualquer gravação**.

Ela usa a chave secreta que o Supabase fornece à Edge Function por meio de variáveis de ambiente. **Nunca copie uma chave secret ou service_role para o navegador ou GitHub.**

## 4. Adicionar o código de edição nas secrets do servidor

No Supabase: **Edge Functions → Secrets**.

Crie:
- **ALBUM_EDIT_TOKEN**: código aleatório e longo, com **pelo menos 24 caracteres**, recomendado 32 ou mais. Não use nome, aniversário ou senha fácil. Guarde-o num gerenciador de senhas; ele **nunca entra nos arquivos públicos**.
- **ALBUM_ALLOWED_ORIGIN** (opcional): origem do site, como `https://juan262-dev.github.io`. Se o site usar domínio personalizado, use essa origem. Isso limita o acesso no navegador mas **não substitui a proteção do código**.

O código é solicitado apenas ao tentar salvar alguma alteração. Sem código, todos continuam podendo **ver** o álbum.

## 5. Conectar o GitHub Pages à nuvem

Use **Settings → API** do projeto para copiar somente a **Project URL**, parecida com `https://seuprojeto.supabase.co`.

Em `cloud-config.js`, preencha:
```js
window.albumCloudConfig = Object.freeze({
  projectUrl: 'https://seuprojeto.supabase.co'
});
```

**Não** insira chave secreta ou o código de edição nessa configuração.

Quando o site for atualizado, a barra no topo mostrará **“Lembranças sincronizadas”** se a função estiver funcionando. Sem URL, o modo local antigo continua disponível. Se a nuvem estiver fora do ar, o site mostra a cópia das fotos publicadas mas bloqueia edição para evitar perda/confusão.

## 6. Testar antes de usar

1. Abra o site em dois celulares.
2. Confira as cinco fotografias e os relatos já cadastrados.
3. No primeiro, abra **Editar memórias**, altere um relato ou envie uma foto e clique em Salvar.
4. Cole o código de edição quando solicitado.
5. Atualize o segundo celular: a edição deverá aparecer.
6. Crie um bilhete, escolha o link de música e adicione um sonho; confira nos dois aparelhos.
7. Faça um backup JSON em **Backup e publicação** e confira a restauração.

**O editor e os extras gravam na nuvem quando conectados, e não precisam substituir `memorias.js` no GitHub.** A exportação desses arquivos continua disponível como cópia manual.

## Segurança e limites

- **Sem login, sem privacidade de leitura.** Pessoas que descobrirem o endereço podem acessar o álbum; a RLS não transforma um conteúdo deliberadamente público em privado.
- Quem tiver o código de edição pode modificar **todas as lembranças**. Se o código vazar, altere `ALBUM_EDIT_TOKEN` nas Secrets.
- Use **código forte**, não PIN de 4 dígitos. O código não é salvo em `localStorage` nem enviado na URL; fica apenas em memória durante a página atual.
- Cada edição é enviada por HTTPS; uploads devem ser fotos de até 5 MB, apenas JPG/PNG/WebP.
- A importação de backup na nuvem é sequencial; uma falha no meio pode aplicar somente parte dos itens. Mantenha o arquivo JSON como cópia de segurança.
- Não há autenticação por conta, histórico de versões, criptografia ponta a ponta ou área privada.
- O repositório do GitHub continua **público**; fotos e histórias anteriormente publicadas continuam lá, mesmo após a migração. Revise-as se necessário.
- O código não inicia cobranças do Supabase automaticamente. Consumo de banco, funções e Storage obedece ao plano contratado.
