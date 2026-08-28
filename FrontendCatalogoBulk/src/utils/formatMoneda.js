/**
 * @fileoverview /utils/formatMoneda.js
 * Formateo de precios en pesos colombianos.
 */

const formateador = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
});

/**
 * Convierte un numero en texto moneda COP.
 * @param {number} valor
 * @returns {string} ej: "$ 125.000"
 */
export function formatMoneda(valor) {
  const n = Number(valor);
  if (Number.isNaN(n)) return "-";
  return formateador.format(n);
}
