
import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { decodificarToken } from "@/utils/jwt";

export const useAuthStore = defineStore(
  "auth",
  () => {

    const token = ref(null);


    const usuario = ref(null);


    const estaAutenticado = computed(() => !!token.value);


    const esAdmin = computed(() => usuario.value?.rol === "admin");


    const etiquetaRol = computed(() => (esAdmin.value ? "Administrador" : "Usuario"));

    function guardarSesion(tokenRecibido) {
      token.value = tokenRecibido;
      usuario.value = decodificarToken(tokenRecibido);
    }

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
