// Endpoint público para LEITURA e protegido por código longo para ESCRITA.
// Configure verify_jwt = false em supabase/config.toml.
// Nunca envie a chave secreta do Supabase ou ALBUM_EDIT_TOKEN ao navegador/GitHub.
import { createClient } from "npm:@supabase/supabase-js@2.86.0";

type Memoria = {
  fotoIndice: number; src: string; legenda: string; data: string | null; relato: string;
};
type Extra = {
  bilhetes: string[];
  musica: { titulo: string; url: string };
  sonhos: { id: string; titulo: string; concluido: boolean }[];
};

const BUCKET = "amor-fotos-publicas";
const MIME: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
};
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_MEMORIES = 40;
const MAX_BILHETES = 50;
const MAX_SONHOS = 50;

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extraHeaders },
  });
}

function texto(valor: unknown, limite: number) {
  return typeof valor === "string" ? valor.trim().slice(0, limite + 1) : "";
}

function dataValida(valor: unknown): valor is string | null {
  if (valor === null || valor === "") return true;
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const [ano, mes, dia] = valor.split("-").map(Number);
  const checagem = new Date(Date.UTC(ano, mes - 1, dia));
  return checagem.getUTCFullYear() === ano && checagem.getUTCMonth() === mes - 1
    && checagem.getUTCDate() === dia;
}

function urlHttps(valor: string) {
  try {
    const url = new URL(valor);
    return url.protocol === "https:" && !url.username && !url.password && valor.length <= 1200;
  } catch { return false; }
}

function urlFoto(valor: string) {
  return urlHttps(valor) || (
    /^fotos\/[a-zA-Z0-9_./-]+\.(jpg|jpeg|png|webp|gif)$/i.test(valor)
    && !valor.includes("..") && valor.length <= 200
  );
}

function normalizarMemoria(dados: unknown, temArquivo = false): Memoria | null {
  if (!dados || typeof dados !== "object") return null;
  const d = dados as Record<string, unknown>;
  if (!Number.isInteger(d.fotoIndice) || (d.fotoIndice as number) < 0 ||
      (d.fotoIndice as number) >= MAX_MEMORIES ||
      typeof d.legenda !== "string" || !d.legenda.trim() || d.legenda.length > 110 ||
      typeof d.relato !== "string" || d.relato.length > 1600 ||
      typeof d.src !== "string" || (!urlFoto(d.src) && !temArquivo) ||
      !dataValida(d.data)) return null;
  return {
    fotoIndice: d.fotoIndice as number,
    src: d.src, legenda: d.legenda.trim(),
    data: d.data === "" ? null : d.data as string | null,
    relato: d.relato.trim(),
  };
}

function normalizarExtras(dados: unknown): Extra | null {
  if (!dados || typeof dados !== "object") return null;
  const d = dados as Record<string, unknown>;
  if (!Array.isArray(d.bilhetes) || d.bilhetes.length > MAX_BILHETES ||
    d.bilhetes.some(x => typeof x !== "string" || !x.trim() || x.length > 300) ||
    !Array.isArray(d.sonhos) || d.sonhos.length > MAX_SONHOS ||
    d.sonhos.some(x => !x || typeof x !== "object" ||
      typeof x.id !== "string" || x.id.length > 70 ||
      typeof x.titulo !== "string" || !x.titulo.trim() || x.titulo.length > 140 ||
      typeof x.concluido !== "boolean") ||
    !d.musica || typeof d.musica !== "object") return null;

  const musica = d.musica as Record<string, unknown>;
  if (typeof musica.titulo !== "string" || musica.titulo.length > 110 ||
    typeof musica.url !== "string" || musica.url.length > 1200 ||
    (musica.url && (!urlHttps(musica.url) || !musica.titulo.trim()))) return null;

  return {
    bilhetes: d.bilhetes.map(x => (x as string).trim()),
    sonhos: d.sonhos.map(x => ({
      id: texto(x.id, 70), titulo: texto(x.titulo, 140), concluido: x.concluido === true,
    })),
    musica: { titulo: musica.titulo.trim(), url: musica.url },
  };
}

function assinaturaCorreta(bytes: Uint8Array, mime: string) {
  if (mime === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/png") return bytes.length >= 8
    && [137,80,78,71,13,10,26,10].every((n, i) => bytes[i] === n);
  if (mime === "image/webp") return bytes.length >= 12
    && new TextDecoder().decode(bytes.subarray(0, 4)) === "RIFF"
    && new TextDecoder().decode(bytes.subarray(8, 12)) === "WEBP";
  return false;
}

async function igualSeguro(a: string, b: string): Promise<boolean> {
  const bytes = new TextEncoder();
  const [aHash, bHash] = await Promise.all([a, b].map(async s =>
    new Uint8Array(await crypto.subtle.digest("SHA-256", bytes.encode(s)))));
  let dif = 0;
  for (let i = 0; i < aHash.length; i++) dif |= aHash[i] ^ bHash[i];
  return dif === 0;
}

function chaveServidor() {
  const antiga = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (antiga) return antiga;
  try {
    const novas = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    const chaveOuNome = typeof novas.default === "string" ? novas.default : "";
    return chaveOuNome.startsWith("sb_secret_")
      ? chaveOuNome
      : (Deno.env.get(chaveOuNome) || "");
  } catch { return ""; }
}

function origemPermitida(req: Request) {
  const restrita = Deno.env.get("ALBUM_ALLOWED_ORIGIN") || "";
  const origem = req.headers.get("origin");
  return !restrita || !origem || origem === restrita;
}

Deno.serve(async (req: Request) => {
  const restrita = Deno.env.get("ALBUM_ALLOWED_ORIGIN") || "";
  const origin = req.headers.get("origin") || "";
  const cors: Record<string, string> = {
    "Access-Control-Allow-Origin": restrita && origin === restrita ? restrita : (restrita || "*"),
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, x-album-edit-code",
    "Vary": "Origin",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: origemPermitida(req) ? 204 : 403, headers: cors });
  }
  if (!origemPermitida(req)) return json({ erro: "Origem não autorizada." }, 403, cors);
  if (!["GET", "POST"].includes(req.method)) return json({ erro: "Método não permitido." }, 405, cors);

  const url = Deno.env.get("SUPABASE_URL") || "";
  const chave = chaveServidor();
  if (!url || !chave) return json({ erro: "Serviço ainda não configurado." }, 503, cors);
  const supabase = createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    if (req.method === "GET") {
      const [memorias, extras] = await Promise.all([
        supabase.from("amor_memorias")
          .select("foto_indice,src,legenda,data,relato").order("foto_indice", { ascending: true }),
        supabase.from("amor_extras").select("bilhetes,musica,sonhos").eq("id", 1).maybeSingle(),
      ]);
      if (memorias.error || extras.error) throw new Error("Leitura indisponível.");
      return json({
        memorias: (memorias.data || []).map(row => ({
          fotoIndice: row.foto_indice, src: row.src, legenda: row.legenda,
          data: row.data, relato: row.relato,
        })),
        extras: extras.data || { bilhetes: [], musica: { titulo: "", url: "" }, sonhos: [] },
      }, 200, cors);
    }

    const segredo = Deno.env.get("ALBUM_EDIT_TOKEN") || "";
    const enviado = req.headers.get("x-album-edit-code") || "";
    // Um PIN curto NÃO basta. Configure um código aleatório com pelo menos 24 caracteres.
    if (segredo.length < 24 || enviado.length < 24 || enviado.length > 200 ||
        !(await igualSeguro(enviado, segredo))) {
      return json({ erro: "Código de edição incorreto ou não configurado." }, 403, cors);
    }

    const tipo = req.headers.get("content-type") || "";
    let acao = "";
    let corpo: unknown = null;
    let imagem: File | null = null;

    if (tipo.includes("multipart/form-data")) {
      const dados = await req.formData();
      acao = String(dados.get("acao") || "");
      const memoria = dados.get("memoria");
      if (typeof memoria !== "string" || memoria.length > 6500) {
        return json({ erro: "Memória inválida." }, 400, cors);
      }
      corpo = JSON.parse(memoria);
      const arquivo = dados.get("foto");
      imagem = arquivo instanceof File ? arquivo : null;
    } else if (tipo.includes("application/json")) {
      if (Number(req.headers.get("content-length") || 0) > 30000) {
        return json({ erro: "Pedido grande demais." }, 413, cors);
      }
      const entrada = await req.json();
      acao = entrada?.acao;
      corpo = entrada?.dados;
    } else {
      return json({ erro: "Formato não suportado." }, 415, cors);
    }

    if (acao === "salvar-memoria") {
      const memoria = normalizarMemoria(corpo, Boolean(imagem));
      if (!memoria) return json({ erro: "Preencha todos os campos obrigatórios corretamente." }, 400, cors);

      const { data: existentes, error: erroExistentes } = await supabase
        .from("amor_memorias").select("foto_indice").order("foto_indice");
      if (erroExistentes) throw new Error("Não foi possível consultar as memórias.");
      const indices = new Set((existentes || []).map(row => row.foto_indice));
      if (!indices.has(memoria.fotoIndice) && memoria.fotoIndice !== indices.size) {
        return json({ erro: "Adicione as fotos na sequência do álbum." }, 409, cors);
      }

      let arquivoEnviado: string | null = null;
      if (imagem) {
        if (!MIME[imagem.type] || imagem.size > MAX_BYTES || imagem.size < 16) {
          return json({ erro: "Escolha JPG, PNG ou WebP com até 5 MB." }, 400, cors);
        }
        const bytes = new Uint8Array(await imagem.arrayBuffer());
        if (!assinaturaCorreta(bytes, imagem.type)) {
          return json({ erro: "O conteúdo não corresponde ao formato da imagem." }, 400, cors);
        }
        arquivoEnviado = crypto.randomUUID() + "." + MIME[imagem.type];
        const upload = await supabase.storage.from(BUCKET).upload(arquivoEnviado, bytes, {
          contentType: imagem.type, upsert: false, cacheControl: "3600",
        });
        if (upload.error) throw new Error("Não foi possível enviar a foto.");
        memoria.src = supabase.storage.from(BUCKET).getPublicUrl(arquivoEnviado).data.publicUrl;
      }

      const gravado = await supabase.from("amor_memorias").upsert({
        foto_indice: memoria.fotoIndice, src: memoria.src, legenda: memoria.legenda,
        data: memoria.data, relato: memoria.relato, atualizado_em: new Date().toISOString(),
      }, { onConflict: "foto_indice" });
      if (gravado.error) {
        if (arquivoEnviado) await supabase.storage.from(BUCKET).remove([arquivoEnviado]);
        throw new Error("Não foi possível salvar a memória.");
      }
      return json({ ok: true, memoria }, 200, cors);
    }

    if (acao === "salvar-extras") {
      const extras = normalizarExtras(corpo);
      if (!extras) return json({ erro: "Bilhetes, música ou sonhos inválidos." }, 400, cors);
      const gravado = await supabase.from("amor_extras").upsert({
        id: 1, ...extras, atualizado_em: new Date().toISOString(),
      }, { onConflict: "id" });
      if (gravado.error) throw new Error("Não foi possível salvar as surpresas.");
      return json({ ok: true }, 200, cors);
    }
    return json({ erro: "Operação desconhecida." }, 400, cors);
  } catch (_erro) {
    return json({ erro: "Não foi possível concluir o pedido. Tente novamente." }, 500, cors);
  }
});
