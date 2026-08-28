/**
 * @fileoverview /utils/jwt.js
 * Funciones puras para leer un token JWT sin verificar la firma.
 *
 * El backend solo devuelve { token } en el login y el payload trae
 * { sub: usuarioId, rol }. Aqui se decodifica para saber quien entro y su rol,
 * sin necesidad de un endpoint /auth/me.
 */

/**
 * Decodifica el payload de un JWT (parte del medio) y lo devuelve como objeto.
 * NO valida la firma: la validacion real la hace el backend en cada peticion.
 * @param {string} token
 * @returns {Object|null} payload decodificado, o null si no se pudo leer
 */
export function decodificarToken(token) {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    // Base64url -> Base64 estandar -> bytes -> string UTF-8.
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}
