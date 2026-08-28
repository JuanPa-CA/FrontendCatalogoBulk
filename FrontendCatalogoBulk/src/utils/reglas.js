/**
 * @fileoverview /utils/reglas.js
 * REGLAS DE VALIDACION PARA LOS FORMULARIOS (prop :rules de Quasar).
 *
 * Cada regla recibe el valor y devuelve true (valido) o un texto (el error).
 * Son "fabricas": funciones que devuelven la regla ya personalizada.
 */
import { validateEmail } from "./validateEmail";

/**
 * El campo no puede ir vacio.
 */
export const requerido =
  (campo = "Este campo") =>
  (v) =>
    (v !== null && v !== undefined && String(v).trim() !== "") ||
    `${campo} es obligatorio`;

/**
 * Formato de correo valido.
 */
export const esEmail =
  () =>
  (v) =>
    validateEmail(v) || "El email no es valido";

/**
 * Longitud minima de texto.
 */
export const minimo =
  (min, campo = "Este campo") =>
  (v) =>
    String(v ?? "").trim().length >= min ||
    `${campo} debe tener al menos ${min} caracteres`;

/**
 * Longitud maxima de texto.
 */
export const maximo =
  (max, campo = "Este campo") =>
  (v) =>
    String(v ?? "").trim().length <= max ||
    `${campo} no puede superar los ${max} caracteres`;

/**
 * Solo digitos (documentos, telefonos).
 */
export const soloNumeros =
  () =>
  (v) =>
    /^\d+$/.test(String(v ?? "").trim()) || "Solo se permiten numeros";

/**
 * Numero entero estrictamente mayor que un minimo.
 */
export const enteroMayorA =
  (min, campo = "El valor") =>
  (v) => {
    const n = Number(v);
    return (
      (Number.isInteger(n) && n > min) ||
      `${campo} debe ser un numero entero mayor a ${min}`
    );
  };

/**
 * Numero mayor o igual a un minimo (admite decimales).
 */
export const mayorIgualA =
  (min, campo = "El valor") =>
  (v) =>
    (v !== null && v !== undefined && v !== "" && Number(v) >= min) ||
    `${campo} debe ser mayor o igual a ${min}`;

/**
 * Numero entero mayor o igual a un minimo.
 */
export const enteroMayorIgualA =
  (min, campo = "El valor") =>
  (v) => {
    const n = Number(v);
    return (
      (Number.isInteger(n) && n >= min) ||
      `${campo} debe ser un numero entero mayor o igual a ${min}`
    );
  };

/**
 * Slug: minusculas, numeros y guiones, sin espacios.
 */
export const esSlug =
  (campo = "Este campo") =>
  (v) =>
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(v ?? "").trim()) ||
    `${campo} debe ir en minusculas, sin espacios (ej: acme-corp)`;

/**
 * URL http(s). Si el campo es opcional y esta vacio, se considera valido.
 */
export const esUrl =
  () =>
  (v) => {
    const s = String(v ?? "").trim();
    if (s === "") return true;

    try {
      const u = new URL(s);
      return (
        u.protocol === "http:" || u.protocol === "https:" ||
        "La URL debe empezar con http:// o https://"
      );
    } catch {
      return "La URL no es valida";
    }
  };

/**
 * Obliga a elegir una opcion en un q-select.
 */
export const seleccionRequerida =
  (campo = "Este campo") =>
  (v) =>
    (v !== null && v !== undefined && v !== "") || `Debe seleccionar ${campo}`;

/**
 * El valor debe ser igual a otro (confirmar contraseña).
 */
export const igualA =
  (obtenerEsperado, mensaje = "Los valores no coinciden") =>
  (v) =>
    v === obtenerEsperado() || mensaje;
