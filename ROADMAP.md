# Upgrade completo — Nossa História Infinita ❤️

Esta branch reúne as quatro etapas para revisão conjunta. O Pull Request fica em **rascunho**, sem merge na `main` antes da aprovação.

## Etapa 1 — Editor de memórias (implementada)

- Editar fotos já existentes: data, legenda, relato e caminho da imagem
- Adicionar novas imagens por URL HTTPS direta ou caminho já existente em `fotos/`
- Salvar no `localStorage` do navegador, exportar `memorias.js`, restaurar as memórias publicadas
- Atualizar álbum, capítulos, modal e prévias após recarregar

## Etapa 2 — Design premium (implementada)

- Navegação pelos capítulos como páginas, com botões Anterior/Próxima
- Indicador da página atual e animação sutil de transição
- Ajustes para telas pequenas e `prefers-reduced-motion`
- Áreas de bilhetes, música e sonhos integradas ao tema de scrapbook

## Etapa 3 — Surpresas (implementada)

- Pote de bilhetinhos que sorteia mensagens já presentes no aplicativo e bilhetes que você criar
- Adicionar e remover bilhetes extras (salvos apenas no aparelho)
- Mensagem discreta de comemoração no dia 29, com base na data do namoro
- Cartão para o link externo da música do casal, sem reproduzir ou hospedar áudio
- Lista de sonhos com marcação de realizados e remoção (salva apenas no aparelho)
- Arquivo `surpresas-data.js` com conteúdo publicado/editável

## Etapa 4 — Backup, restauração e publicação manual (implementada)

- Backup JSON do álbum, incluindo metadados das fotos, bilhetes, música e sonhos
- Importação de backups JSON com limites, verificação das datas, HTTPS, campos e confirmação
- Exportação de `memorias.js` e `surpresas-data.js` para atualizar o GitHub
- Aviso e confirmação obrigatória de que **os dados publicados no GitHub são públicos**
- Sem envio automático de conteúdo à rede

### O que NÃO é possível prometer com um site estático público

**Não há autenticação, banco remoto, sincronização automática entre aparelhos nem proteção real por senha das fotos.** Esses recursos exigem escolher e configurar um serviço de backend com autenticação e regras de acesso, além de tomar decisões sobre privacidade e custos. A quarta etapa aqui oferece **backup/restauração e publicação manual**, não privacidade de arquivos já publicados.

## Antes do merge

- Conferir o visual no celular e no desktop
- Editar uma memória, recarregar e testar exportação
- Criar bilhete, sonho e link de música
- Testar backup, restauração e confirmação de publicação
- Confirmar que todas as fotos e mensagens originais continuam acessíveis

Nenhum acontecimento ou data de fotografias foi inventado.

## Etapa 5 — Sincronização em nuvem sem login (código pronto, ativação pendente)

- Criados os arquivos do banco PostgreSQL, Edge Function e Storage público no diretório `supabase/`.
- O site carrega dados pelo endpoint público GET; os formulários salvam pelo POST com **código de edição longo**, verificado somente no servidor.
- Upload de fotos JPG/PNG/WebP do celular até 5 MB.
- Sincroniza relatos, datas, legendas, bilhetes, música e sonhos entre aparelhos.
- Verifica atualizações e oferece botão para recarregar, sem fechar o formulário automaticamente.
- Backup/restauração podem ser usados também no modo nuvem.
- **Backend configurado:** projeto Supabase `jfedjtdyjpvqzetlexuf` criado em São Paulo, tabelas e Storage implantados, função `album-sync` ativa, URL configurada na branch e código de edição forte registrado apenas por hash.
- **Pendente:** publicar esta branch no GitHub Pages por merge do PR #8 (com autorização), e realizar teste real de ponta a ponta no navegador.
- **Limite da escolha sem login:** qualquer visitante pode ver as lembranças; somente a edição exige código. O sistema NÃO oferece fotos privadas.
