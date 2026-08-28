/**
 * @fileoverview /utils/validateEmail.js
 * Funcion pura: recibe un valor y devuelve un booleano.
 */

// Patron suficiente para un formulario: algo@algo.algo sin espacios.
const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Valida el formato de un correo electronico.
 * @param {string} valor
 * @returns {boolean}
 */
export function validateEmail(valor) {
  return PATRON_EMAIL.test(String(valor ?? "").trim());
}
