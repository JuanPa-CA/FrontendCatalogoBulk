/**
 * @fileoverview /store/Auth.js
 * Store de la SESION: guarda el token JWT y los datos decodificados (sub, rol).
 *
 * El login devuelve solo { token }, asi que el usuario se reconstruye
 * decodificando el payload del JWT (ver /utils/jwt.js): { sub: usuarioId, rol }.
 *
 * PERSISTENCIA: "persist: true" activa pinia-plugin-persistedstate (registrado
 * en main.js), que guarda el estado en localStorage bajo la clave "auth" y lo
 * recupera al abrir la aplicacion.
 */
import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { decodificarToken } from "@/utils/jwt";

export const useAuthStore = defineStore(
  "auth",
  () => {
    // --- state --------------------------------------------------------------
    const token = ref(null);

    /** Payload decodificado del JWT: { sub, rol }. */
    const usuario = ref(null);

    // --- getters ------------------------------------------------------------
    const estaAutenticado = computed(() => !!token.value);

    /** ¿El usuario tiene rol admin? Lo usan el router, el menu y las vistas. */
    const esAdmin = computed(() => usuario.value?.rol === "admin");

    /** Rol en texto legible para la barra superior. */
    const etiquetaRol = computed(() => (esAdmin.value ? "Administrador" : "Usuario"));

    // --- actions ------------------------------------------------------------
    /**
     * Guarda el token y decodifica el usuario a partir de el.
     * @param {string} tokenRecibido
     */
    function guardarSesion(tokenRecibido) {
      token.value = tokenRecibido;
      usuario.value = decodificarToken(tokenRecibido);
    }

    /**
     * Cierra la sesion. Al dejar los ref en null, el plugin limpia solo el
     * localStorage: no hay que borrarlo a mano.
     */
    function cerrarSesion() {
      token.value = null;
      usuario.value = null;
    }

    return {
      token,
      usuario,
      estaAutenticado,
      esAdmin,
      etiquetaRol,
      guardarSesion,
      cerrarSesion,
    };
  },
  {
    persist: true,
  }
);
