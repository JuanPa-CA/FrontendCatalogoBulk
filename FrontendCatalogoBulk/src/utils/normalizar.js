/**
 * @fileoverview /utils/normalizar.js
 * Helpers para leer las respuestas de listado del backend.
 *
 * La API devuelve listas planas (categorias) o listas paginadas (proveedores,
 * productos). Como el formato exacto del objeto paginado puede variar
 * ({ data, docs, items, results, rows }), aqui se normaliza en un solo lugar:
 * si el dia de manana cambia la clave, se toca solo este archivo.
 */

/**
 * Extrae el array de registros de una respuesta, sea array plano u objeto paginado.
 * @param {any} respuesta
 * @returns {Array}
 */
export function extraerLista(respuesta) {
  if (Array.isArray(respuesta)) return respuesta;
  if (!respuesta || typeof respuesta !== "object") return [];

  const claves = ["data", "docs", "items", "results", "rows", "registros"];
  for (const clave of claves) {
    if (Array.isArray(respuesta[clave])) return respuesta[clave];
  }

  return [];
}

/**
 * Extrae el total de registros de una respuesta paginada.
 * @param {any} respuesta
 * @param {Array} [lista] - lista ya extraida, para usarla de respaldo
 * @returns {number}
 */
export function extraerTotal(respuesta, lista = []) {
  if (Array.isArray(respuesta)) return respuesta.length;
  if (!respuesta || typeof respuesta !== "object") return lista.length;

  const claves = ["total", "totalDocs", "count", "totalItems"];
  for (const clave of claves) {
    if (typeof respuesta[clave] === "number") return respuesta[clave];
  }

  return lista.length;
}
