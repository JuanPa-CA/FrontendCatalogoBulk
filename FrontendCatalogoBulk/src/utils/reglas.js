
import { validateEmail } from "./validateEmail";

export const requerido =
  (campo = "Este campo") =>
  (v) =>
    (v !== null && v !== undefined && String(v).trim() !== "") ||
    `${campo} es obligatorio`;


export const esEmail =
  () =>
  (v) =>
    validateEmail(v) || "El email no es valido";

export const minimo =
  (min, campo = "Este campo") =>
  (v) =>
    String(v ?? "").trim().length >= min ||
    `${campo} debe tener al menos ${min} caracteres`;


export const maximo =
  (max, campo = "Este campo") =>
  (v) =>
    String(v ?? "").trim().length <= max ||
    `${campo} no puede superar los ${max} caracteres`;


export const soloNumeros =
  () =>
  (v) =>
    /^\d+$/.test(String(v ?? "").trim()) || "Solo se permiten numeros";


export const enteroMayorA =
  (min, campo = "El valor") =>
  (v) => {
    const n = Number(v);
    return (
      (Number.isInteger(n) && n > min) ||
      `${campo} debe ser un numero entero mayor a ${min}`
    );
  };


export const mayorIgualA =
  (min, campo = "El valor") =>
  (v) =>
    (v !== null && v !== undefined && v !== "" && Number(v) >= min) ||
    `${campo} debe ser mayor o igual a ${min}`;


export const enteroMayorIgualA =
  (min, campo = "El valor") =>
  (v) => {
    const n = Number(v);
    return (
      (Number.isInteger(n) && n >= min) ||
      `${campo} debe ser un numero entero mayor o igual a ${min}`
    );
  };


export const esSlug =
  (campo = "Este campo") =>
  (v) =>
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(v ?? "").trim()) ||
    `${campo} debe ir en minusculas, sin espacios (ej: acme-corp)`;

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

export const seleccionRequerida =
  (campo = "Este campo") =>
  (v) =>
    (v !== null && v !== undefined && v !== "") || `Debe seleccionar ${campo}`;


export const igualA =
  (obtenerEsperado, mensaje = "Los valores no coinciden") =>
  (v) =>
    v === obtenerEsperado() || mensaje;
