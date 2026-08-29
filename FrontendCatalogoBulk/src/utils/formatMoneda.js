

const formateador = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
});



export function formatMoneda(valor) {
  const n = Number(valor);
  if (Number.isNaN(n)) return "-";
  return formateador.format(n);
}
