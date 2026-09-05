<script setup>

import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useGeneralStore } from "@/store/General";
import { useAuthStore } from "@/store/Auth";
import { useNotificar } from "@/composables/useNotificar";
import { formatDateTime } from "@/utils/formatDate";
import logo from "@/assets/cubo.png";

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


const opcionesMenu = computed(() => {
  const opciones = [];

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
    <q-header elevated class="bg-primary text-white cabecera">
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
          <div class="row items-center q-gutter-x-xs text-white gt-xs etiqueta-rol">
            <q-icon name="verified_user" size="18px" />
            <span class="text-body2">{{ auth.etiquetaRol }}</span>
          </div>

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
      :width="252"
      class="bg-white"
    >
      <div class="q-pa-md row items-center no-wrap">
        <div class="marco-logo-drawer q-mr-sm">
          <img :src="logo" alt="Logo" class="imagen-logo-drawer" />
        </div>
        <div class="text-weight-bold text-subtitle1">{{ general.titulo }}</div>
      </div>

      <q-separator />

      <q-list padding class="q-px-sm">
        <q-item-label header class="text-uppercase text-caption text-weight-bold text-grey-6">
          Menu
        </q-item-label>

        <q-item
          v-for="(opcion, indice) in opcionesMenu"
          :key="opcion.name"
          v-ripple
          clickable
          class="enlace-menu rounded-borders q-mb-xs item-animado"
          active-class="enlace-menu--activo"
          :style="{ animationDelay: `${indice * 60}ms` }"
          :to="{ name: opcion.name }"
        >
          <q-item-section avatar>
            <q-icon :name="opcion.icono" />
          </q-item-section>
          <q-item-section>{{ opcion.titulo }}</q-item-section>
        </q-item>
      </q-list>

      <div class="absolute-bottom q-pa-md text-caption text-grey-6 pie-drawer">
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

    <q-page-container class="fondo-contenido">
      <router-view v-slot="{ Component }">
        <transition name="pagina" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<style scoped lang="scss">
.cabecera {
  background: linear-gradient(120deg, var(--q-primary) 0%, #1f5c22 100%);
}

.etiqueta-rol {
  opacity: 0.9;
  margin-right: 4px;
}

.marco-logo-drawer {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  transition: transform 0.25s ease;

  &:hover {
    transform: scale(1.06) rotate(-2deg);
  }
}

.imagen-logo-drawer {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.enlace-menu {
  color: rgba(0, 0, 0, 0.72) !important;
  text-decoration: none;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease;

  .q-icon {
    color: rgba(0, 0, 0, 0.45);
    transition: color 0.15s ease, transform 0.2s ease;
  }

  &:hover {
    background-color: rgba(var(--q-primary-rgb, 33, 115, 40), 0.06);
    transform: translateX(2px);

    .q-icon {
      transform: scale(1.08);
    }
  }

  &--activo {
    background-color: rgba(var(--q-primary-rgb, 33, 115, 40), 0.1);
    color: var(--q-primary) !important;
    font-weight: 600;
    border-left: 3px solid var(--q-primary);
    padding-left: calc(16px - 3px);

    .q-icon {
      color: var(--q-primary);
    }
  }
}

// Entrada escalonada de los items del menu al montar el drawer
.item-animado {
  opacity: 0;
  animation: entrar-item 0.35s ease forwards;
}

@keyframes entrar-item {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .item-animado {
    animation: none;
    opacity: 1;
  }
}

.pie-drawer {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.fondo-contenido {
  background: #f7f8f7;
  min-height: 100vh;
}

// Transicion entre paginas del router-view
.pagina-enter-active,
.pagina-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.pagina-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.pagina-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (prefers-reduced-motion: reduce) {
  .pagina-enter-active,
  .pagina-leave-active {
    transition: none;
  }
}
</style>