
export function extraerLista(respuesta) {
  if (Array.isArray(respuesta)) return respuesta;
  if (!respuesta || typeof respuesta !== "object") return [];

  const claves = ["data", "docs", "items", "results", "rows", "registros"];
  for (const clave of claves) {
    if (Array.isArray(respuesta[clave])) return respuesta[clave];
  }

  return [];
}

export function extraerTotal(respuesta, lista = []) {
  if (Array.isArray(respuesta)) return respuesta.length;
  if (!respuesta || typeof respuesta !== "object") return lista.length;

  const claves = ["total", "totalDocs", "count", "totalItems"];
  for (const clave of claves) {
    if (typeof respuesta[clave] === "number") return respuesta[clave];
  }

  return lista.length;
}
