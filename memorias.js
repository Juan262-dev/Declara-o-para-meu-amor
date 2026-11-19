// Nossa História Infinita — metadados opcionais das fotos do álbum.
//
// As cinco fotografias, seus links e legendas continuam no index.html.
// Aqui só associamos cada uma a um capítulo, na MESMA ordem da galeria.
// A ordem das fotos NÃO afirma que os acontecimentos foram cronológicos.
//
// Datas e relatos informados nas fotos 1 e 2 foram preservados abaixo.
// As fotos 3 a 5 continuam sem data ou relato até serem preenchidas.
// Para personalizar mais tarde, preencha:
//   data: '2026-10-15'       // AAAA-MM-DD (exemplo de FORMATO, não uma data real)
//   relato: 'Texto fornecido por vocês'
// Não associe automaticamente as fotos à data do começo do namoro.
window.albumMemorias = Object.freeze([
  Object.freeze({ fotoIndice: 0, data: '2026-09-28', relato: 'Um dia antes do aniversário do meu amor' }),
  Object.freeze({ fotoIndice: 1, data: '2026-09-30', relato: 'um dia apos o pedido oficial de namoro' }),
  Object.freeze({ fotoIndice: 2, data: null, relato: '' }),
  Object.freeze({ fotoIndice: 3, data: null, relato: '' }),
  Object.freeze({ fotoIndice: 4, data: null, relato: '' })
]);
