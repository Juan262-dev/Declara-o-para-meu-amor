# Declaração para meu amor ❤️

Uma página romântica e interativa feita com **HTML, CSS e JavaScript**, sem precisar instalar bibliotecas ou usar servidor.

## Funcionalidades

- Pergunta interativa com botões “Sim” e “Não”.
- Declaração com três fotografias e suas legendas.
- Aba **Nosso Tempo** com cronômetro desde **29/09/2026 às 20:33**.
- Layout adaptado para telas pequenas.

## Como abrir

Abra o arquivo `index.html` em um navegador. Para publicar na web, você também pode utilizar o GitHub Pages.

## Como personalizar

Tudo fica no arquivo `index.html`:

- **Data e horário:** altere `const dataInicio = new Date(2026, 8, 29, 20, 33, 0)`. Em JavaScript, os meses começam no zero: `8` representa setembro.
- **Declaração:** edite o texto dentro de `<div class="texto-declaracao">` na aba de declaração.
- **Fotografias:** substitua os endereços `src` das três tags `<img>` e personalize as legendas.
- **Frases do botão “Não”:** altere a lista `frasesNao`.

## Observações

- O cronômetro usa a data e o fuso horário do dispositivo de quem abre a página.
- As fotografias atuais vêm de links externos do Imgur. Se algum link deixar de funcionar, será necessário substituí-lo. Para maior estabilidade, é recomendável hospedar as imagens no próprio repositório.
- O cronômetro conta meses e anos por calendário, e os dias, horas, minutos e segundos pelo tempo decorrido desde o último aniversário mensal.
