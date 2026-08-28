<script setup>
/**
 * /layouts/AdminLayout.vue
 * Plantilla UNICA de la aplicacion: barra superior + menu lateral + pie.
 * Todas las vistas se pintan en su <router-view>.
 */
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useGeneralStore } from "@/store/General";
import { useAuthStore } from "@/store/Auth";
import { useNotificar } from "@/composables/useNotificar";
import { formatDateTime } from "@/utils/formatDate";
import logo from "@/assets/logo.svg";

const general = useGeneralStore();
const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const { notificarInfo } = useNotificar();

const salir = () => {
  auth.cerrarSesion();
  notificarInfo("Sesion cerrada");
  router.push({ name: "login" });
};

/**
 * Opciones del menu lateral. El catalogo lo ve cualquiera con sesion; el resto
 * de modulos son solo de administrador.
 */
const opcionesMenu = computed(() => {
  const opciones = [{ name: "catalogo", titulo: "Catalogo", icono: "storefront" }];

  if (auth.esAdmin) {
    opciones.push(
      { name: "productos", titulo: "Productos", icono: "inventory_2" },
      { name: "proveedores", titulo: "Proveedores", icono: "local_shipping" },
      { name: "categorias", titulo: "Categorias", icono: "category" },
      { name: "usuarios", titulo: "Usuarios", icono: "manage_accounts" }
    );
  }

  return opciones;
});

const tituloSeccion = computed(() => route.meta?.titulo || "Panel");
</script>

<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Abrir menu"
          @click="general.alternarMenu()"
        />

        <q-toolbar-title class="text-weight-bold text-subtitle1">
          {{ tituloSeccion }}
        </q-toolbar-title>

        <template v-if="auth.estaAutenticado">
          <q-chip
            dense
            color="green-9"
            text-color="white"
            icon="verified_user"
            class="gt-xs"
          >
            {{ auth.etiquetaRol }}
          </q-chip>

          <q-btn flat dense round icon="logout" aria-label="Cerrar sesion" @click="salir">
            <q-tooltip>Cerrar sesion</q-tooltip>
          </q-btn>
        </template>

        <q-btn
          v-else
          flat
          dense
          no-caps
          icon="login"
          label="Entrar"
          :to="{ name: 'login' }"
        />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="general.menuAbierto"
      show-if-above
      bordered
      :width="248"
      class="bg-white"
    >
      <div class="q-pa-md row items-center no-wrap">
        <img :src="logo" alt="Logo" width="34" height="34" class="q-mr-sm" />
        <div class="text-weight-bold">{{ general.titulo }}</div>
      </div>

      <q-separator />

      <q-list padding>
        <q-item-label header class="text-uppercase text-caption text-weight-bold">
          Menu
        </q-item-label>

        <q-item
          v-for="opcion in opcionesMenu"
          :key="opcion.name"
          v-ripple
          clickable
          class="enlace-menu"
          :to="{ name: opcion.name }"
        >
          <q-item-section avatar>
            <q-icon :name="opcion.icono" />
          </q-item-section>
          <q-item-section>{{ opcion.titulo }}</q-item-section>
        </q-item>
      </q-list>

      <div class="absolute-bottom q-pa-md text-caption texto-suave">
        <div>
          <q-icon name="dns" size="14px" class="q-mr-xs" />
          {{ general.urlApi }}
        </div>
        <div v-if="general.ultimaSincronizacion" class="q-mt-xs">
          <q-icon name="schedule" size="14px" class="q-mr-xs" />
          {{ formatDateTime(general.ultimaSincronizacion) }}
        </div>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>
