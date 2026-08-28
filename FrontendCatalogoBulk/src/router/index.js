/**
 * @fileoverview /router/index.js
 * TODA la configuracion de rutas de la aplicacion, en un solo archivo.
 *
 *   /              -> Login          (unica pantalla publica)
 *   /catalogo      -> AdminLayout    (cualquier usuario autenticado)
 *   /productos     -> AdminLayout    (solo admin)
 *   /proveedores   -> AdminLayout    (solo admin)
 *   /categorias    -> AdminLayout    (solo admin)
 *   /usuarios      -> AdminLayout    (solo admin)
 */
import { createRouter, createWebHashHistory } from "vue-router";
import { Notify } from "quasar";

import { useAuthStore } from "@/store/Auth";

import AdminLayout from "@/layouts/AdminLayout.vue";

import LoginView from "@/views/LoginView.vue";
import CatalogoView from "@/views/CatalogoView.vue";
import ProductosView from "@/views/ProductosView.vue";
import ProveedoresView from "@/views/ProveedoresView.vue";
import CategoriasView from "@/views/CategoriasView.vue";
import UsuariosView from "@/views/UsuariosView.vue";
import NotFoundView from "@/views/NotFoundView.vue";

const routes = [
  {
    path: "/",
    name: "login",
    component: LoginView,
    meta: { titulo: "Iniciar sesion", soloInvitados: true },
  },
  {
    path: "/",
    component: AdminLayout,
    children: [
      {
        path: "catalogo",
        name: "catalogo",
        component: CatalogoView,
        meta: { titulo: "Catalogo", requiereAuth: true },
      },
      {
        path: "productos",
        name: "productos",
        component: ProductosView,
        meta: { titulo: "Productos", requiereAuth: true, requiereAdmin: true },
      },
      {
        path: "proveedores",
        name: "proveedores",
        component: ProveedoresView,
        meta: { titulo: "Proveedores", requiereAuth: true, requiereAdmin: true },
      },
      {
        path: "categorias",
        name: "categorias",
        component: CategoriasView,
        meta: { titulo: "Categorias", requiereAuth: true, requiereAdmin: true },
      },
      {
        path: "usuarios",
        name: "usuarios",
        component: UsuariosView,
        meta: { titulo: "Usuarios", requiereAuth: true, requiereAdmin: true },
      },
      {
        path: ":pathMatch(.*)*",
        name: "no-encontrado",
        component: NotFoundView,
        meta: { titulo: "Pagina no encontrada" },
      },
    ],
  },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ left: 0, top: 0 }),
});

/**
 * PROTECCION DE RUTAS (guard global).
 */
function protegerRutas(to) {
  const auth = useAuthStore();

  // 1. Ruta privada y sin sesion: se avisa y se manda al login.
  if (to.meta.requiereAuth === true && !auth.estaAutenticado) {
    Notify.create({
      type: "negative",
      message: "Debes iniciar sesion para entrar a esa pagina",
      icon: "lock",
      position: "top-right",
    });

    return { name: "login" };
  }

  // 2. Ruta de administrador sin rol admin: se manda al catalogo.
  if (to.meta.requiereAdmin === true && !auth.esAdmin) {
    Notify.create({
      type: "negative",
      message: "No tienes permisos de administrador",
      icon: "shield",
      position: "top-right",
    });

    return { name: "catalogo" };
  }

  // 3. Login con sesion abierta: se manda a su primera pantalla.
  if (to.meta.soloInvitados === true && auth.estaAutenticado) {
    return { name: auth.esAdmin ? "productos" : "catalogo" };
  }

  return true;
}

router.beforeEach(protegerRutas);

/**
 * Guard que cambia el titulo de la pestana tras cada navegacion.
 */
router.afterEach((to) => {
  const base = import.meta.env.VITE_APP_TITULO || "Catalogo Bulk";
  document.title = to.meta.titulo ? `${to.meta.titulo} | ${base}` : base;
});
