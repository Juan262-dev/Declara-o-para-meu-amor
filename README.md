# Para o meu amor ❤️

Uma página romântica no estilo **álbum de memórias**, feita com HTML, CSS e JavaScript. Não precisa de servidor nem de ferramentas de instalação.

## O que tem no álbum

- **Início:** apresentação da história, com duas prévias de fotos.
- **Nossa história:** a data do começo do namoro, em **29/09/2026 às 20h33**.
- **Cartinha:** um envelope interativo que revela a declaração original.
- **Galeria:** três fotografias em cartões tipo Polaroid; toque para abrir ampliada, navegar e fechar.
- **Nosso tempo:** cronômetro com anos, meses, dias, horas, minutos e segundos.
- **Surpresa:** a brincadeira original com os botões “Sim” e “Não”.

## Arquivos

- `index.html`: estrutura e textos, incluindo os endereços e legendas das fotos.
- `styles.css`: cores, tipografia, decoração e ajustes para celular.
- `app.js`: galeria ampliada, cronômetro e lógica da surpresa.

Para usar, abra `index.html` em um navegador moderno ou publique os arquivos juntos no GitHub Pages.

## Personalização

- **Data do namoro:** edite `const dataInicio = new Date(2026, 8, 29, 20, 33, 0)` no arquivo `app.js`. Os meses no JavaScript começam em zero (setembro = 8).
- **Fotos:** atualize os endereços `src` nas imagens do `index.html`. A galeria usa as imagens e legendas da própria página, sem duplicá-las no JavaScript.
- **Declarações:** edite os parágrafos da seção `#cartinha` e `#tempo` em `index.html`.
- **Frases do botão “Não”:** edite a lista `frasesNao` em `app.js`.
- **Cores:** ajuste as variáveis em `:root` no início de `styles.css`.

## Observações

- O relógio considera a data e o fuso horário do dispositivo de quem abre a página.
- As imagens atuais são carregadas do Imgur. Para maior estabilidade, coloque as fotos no próprio repositório e atualize os caminhos.
- A página usa fontes do Google Fonts quando há conexão; se estiver offline, utiliza fontes alternativas.
- O diálogo de fotografias aceita fechamento pelo botão “×” ou tecla Esc, e as setas do teclado passam entre as fotos.
