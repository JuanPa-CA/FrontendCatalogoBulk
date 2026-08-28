/**
 * @fileoverview /store/General.js
 * Store GLOBAL de interfaz: lo que no pertenece a ningun modelo del backend
 * pero varias pantallas necesitan compartir (menu lateral, titulo, hora de la
 * ultima carga de datos).
 */
import { computed, ref } from "vue";
import { defineStore } from "pinia";

export const useGeneralStore = defineStore("general", () => {
  // --- state ---------------------------------------------------------------
  const titulo = ref(import.meta.env.VITE_APP_TITULO || "Catalogo Bulk");

  const menuAbierto = ref(false);

  const ultimaSincronizacion = ref(null);

  // --- getters ---------------------------------------------------------------
  const urlApi = computed(() => import.meta.env.VITE_API_URL);

  // --- actions ---------------------------------------------------------------
  function alternarMenu() {
    menuAbierto.value = !menuAbierto.value;
  }

  function marcarSincronizacion() {
    ultimaSincronizacion.value = new Date();
  }

  return {
    titulo,
    menuAbierto,
    ultimaSincronizacion,
    urlApi,
    alternarMenu,
    marcarSincronizacion,
  };
});
