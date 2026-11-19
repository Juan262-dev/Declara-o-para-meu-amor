// Nossa História Infinita — metadados opcionais das fotos do álbum.
//
// As três fotografias, seus links e legendas continuam no index.html.
// Aqui só associamos cada uma a um capítulo, na MESMA ordem da galeria.
// A ordem das fotos NÃO afirma que os acontecimentos foram cronológicos.
//
// Nenhuma data ou história das fotografias foi informada: ficam vazias.
// Para personalizar mais tarde, preencha:
//   data: '2026-10-15'       // AAAA-MM-DD (exemplo de FORMATO, não uma data real)
//   relato: 'Texto fornecido por vocês'
// Não associe automaticamente as fotos à data do começo do namoro.
window.albumMemorias = Object.freeze([
  Object.freeze({ fotoIndice: 0, data: null, relato: '' }),
  Object.freeze({ fotoIndice: 1, data: null, relato: '' }),
  Object.freeze({ fotoIndice: 2, data: null, relato: '' })
]);
