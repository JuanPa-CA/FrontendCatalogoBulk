/**
 * @fileoverview /plugins/axios.js
 * UNA sola instancia de axios para toda la aplicacion.
 *
 * La URL del backend, las cabeceras y el manejo de errores se configuran en UN
 * solo lugar. Si el backend cambia de puerto, se toca este archivo y nada mas.
 *
 * Cadena de responsabilidad del proyecto:
 *   componente -> store (Pinia) -> service -> ESTE archivo -> backend
 */
import axios from "axios";

import { router } from "@/router";
import { useAuthStore } from "@/store/Auth";

const api = axios.create({
  // Nunca "quemar" la URL en el codigo: viene del .env (VITE_API_URL).
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

/**
 * INTERCEPTOR DE PETICION: se ejecuta ANTES de que salga cada request.
 * Inyecta el token JWT en la cabecera Authorization con el esquema Bearer,
 * que es el que valida el backend.
 */
api.interceptors.request.use((config) => {
  const auth = useAuthStore();

  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }

  return config;
});

/**
 * INTERCEPTOR DE RESPUESTA: normaliza el error para que los stores siempre
 * reciban lo mismo: { mensaje, errores, status }.
 */
api.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const data = error.response?.data;

    const errorNormalizado = {
      status: error.response?.status ?? 0,
      mensaje: data?.msg || data?.message || mensajeSegunFallo(error),
      errores: Array.isArray(data?.errors) ? data.errors : [],
    };

    // 401 = token ausente o vencido. Se cierra la sesion y se vuelve al login.
    if (errorNormalizado.status === 401) {
      cerrarSesionYSalir();
    }

    return Promise.reject(errorNormalizado);
  }
);

/**
 * Limpia la sesion y navega al login.
 */
function cerrarSesionYSalir() {
  const auth = useAuthStore();
  auth.cerrarSesion();

  if (router.currentRoute.value.name !== "login") {
    router.push({ name: "login" });
  }
}

/**
 * Traduce los fallos que NO traen respuesta del servidor.
 */
function mensajeSegunFallo(error) {
  if (error.code === "ECONNABORTED") {
    return "El servidor tardo demasiado en responder";
  }
  if (!error.response) {
    return "No hay conexion con el servidor. ¿Esta corriendo el backend en el puerto 3000?";
  }
  return "Ocurrio un error inesperado";
}

export default api;
