/**
 * @fileoverview /services/api.service.js
 * Las 4 funciones con las que se consume CUALQUIER API: get, post, put y del.
 *
 *   import { get, post, put } from "@/services/api.service";
 *
 *   const proveedores = await get("/proveedores");
 *   await post("/proveedores", { nombre, slug, ... });
 *   await put(`/proveedores/${id}`, { ... });
 *
 * 1. Devuelven directamente el "data" de la respuesta de axios.
 * 2. NO llevan try/catch: el error sube a la vista, ya normalizado por
 *    /plugins/axios.js como { status, mensaje, errores }.
 */
import api from "@/plugins/axios";

export const get = async (url) => {
  const { data } = await api.get(url);
  return data;
};

export const post = async (url, datos) => {
  const { data } = await api.post(url, datos);
  return data;
};

export const put = async (url, datos = {}) => {
  const { data } = await api.put(url, datos);
  return data;
};

/**
 * Se llama "del" y no "delete" porque delete es palabra reservada de JavaScript.
 */
export const del = async (url) => {
  const { data } = await api.delete(url);
  return data;
};
