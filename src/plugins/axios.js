
import axios from "axios";

import { router } from "@/router";
import { useAuthStore } from "@/store/Auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const auth = useAuthStore();

  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }

  return config;
});

api.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const data = error.response?.data;

    const errorNormalizado = {
      status: error.response?.status ?? 0,
      mensaje:
        data?.error?.mensaje ||
        data?.msg ||
        data?.message ||
        mensajeSegunFallo(error),
      errores: Array.isArray(data?.errors) ? data.errors : [],
    };


    if (errorNormalizado.status === 401) {
      cerrarSesionYSalir();
    }

    return Promise.reject(errorNormalizado);
  }
);


function cerrarSesionYSalir() {
  const auth = useAuthStore();
  auth.cerrarSesion();

  if (router.currentRoute.value.name !== "login") {
    router.push({ name: "login" });
  }
}


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
