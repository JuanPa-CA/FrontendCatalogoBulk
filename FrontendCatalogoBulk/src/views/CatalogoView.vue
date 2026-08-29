<script setup>

import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

import ProductoCard from "@/components/Productos/ProductoCard.vue";

import { get } from "@/services/api.service";
import { extraerLista } from "@/utils/normalizar";
import { useGeneralStore } from "@/store/General";
import { useNotificar } from "@/composables/useNotificar";

const general = useGeneralStore();
const { notificarError } = useNotificar();

const productos = ref([]);
const categorias = ref([]);
const proveedores = ref([]);
const cargando = ref(false);
const error = ref(null);

// --- Filtros ---------------------------------------------------------------
const termino = ref("");
const categoriaFiltro = ref(null);
const proveedorFiltro = ref(null);

const mapaProveedores = computed(() => {
  const mapa = {};
  proveedores.value.forEach((p) => {
    mapa[p._id] = p.nombre;
  });
  return mapa;
});

const mapaCategorias = computed(() => {
  const mapa = {};
  categorias.value.forEach((c) => {
    mapa[c.slug] = c.nombre;
  });
  return mapa;
});

const categoriaNombre = (slug) => mapaCategorias.value[slug] || slug;
const proveedorNombre = (id) => mapaProveedores.value[id] || "";

const productosFiltrados = computed(() => {
  const texto = termino.value.trim().toLowerCase();

  return productos.value.filter((p) => {
    const coincideNombre = !texto || String(p.nombre).toLowerCase().includes(texto);
    const coincideCategoria = !categoriaFiltro.value || p.categoria === categoriaFiltro.value;
    const coincideProveedor = !proveedorFiltro.value || p.proveedorId === proveedorFiltro.value;
    return coincideNombre && coincideCategoria && coincideProveedor;
  });
});

const hayFiltrosActivos = computed(
  () => Boolean(termino.value) || categoriaFiltro.value !== null || proveedorFiltro.value !== null
);

const limpiarFiltros = () => {
  termino.value = "";
  categoriaFiltro.value = null;
  proveedorFiltro.value = null;
};

const cargar = async () => {
  cargando.value = true;
  error.value = null;

  try {
    const [respProductos, respCategorias, respProveedores] = await Promise.all([
      get("/productos?limit=1000"),
      get("/categorias"),
      get("/proveedores?limit=1000"),
    ]);

    productos.value = extraerLista(respProductos);
    categorias.value = extraerLista(respCategorias);
    proveedores.value = extraerLista(respProveedores);

    general.marcarSincronizacion();
  } catch (e) {
    error.value = e.mensaje;
    notificarError(e);
  } finally {
    cargando.value = false;
  }
};

onMounted(cargar);

// Esqueleto de carga: solo aparece si tarda mas de 300ms, para no
// generar parpadeo en cargas rapidas.
const mostrarEsqueleto = ref(false);
let temporizadorCarga = null;

watch(
  cargando,
  (valor) => {
    if (valor) {
      temporizadorCarga = setTimeout(() => {
        mostrarEsqueleto.value = true;
      }, 300);
    } else {
      if (temporizadorCarga) clearTimeout(temporizadorCarga);
      mostrarEsqueleto.value = false;
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  if (temporizadorCarga) clearTimeout(temporizadorCarga);
});
</script>
<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container class="fondo-catalogo">
      <q-page>
        <!-- Decoraciones de fondo, mismo lenguaje visual del login -->
        <div class="blob blob--uno bg-primary"></div>
        <div class="blob blob--dos bg-primary"></div>
        <div class="patron-puntos"></div>

        <div class="contenedor-app relative-position">
          <header class="encabezado-catalogo row items-start justify-between no-wrap">
            <div class="row items-center no-wrap">
              <div class="marco-icono-titulo">
                <q-icon name="storefront" size="26px" color="white" />
              </div>
              <div class="q-ml-md">
                <h1 class="titulo-vista style-text q-my-none">Catalogo</h1>
                <p class="texto-suave q-mb-none">Explora los productos disponibles</p>
              </div>
            </div>
          </header>

          <div class="linea-titulo"></div>

          <q-banner v-if="error" dense class="bg-red-1 text-negative q-my-md rounded-borders">
            <template #avatar>
              <q-icon name="error_outline" />
            </template>
            {{ error }}
            <template #action>
              <q-btn flat dense no-caps label="Reintentar" @click="cargar" />
            </template>
          </q-banner>

          <div class="row q-col-gutter-lg q-mt-sm">
            <!-- Filtros laterales -->
            <div class="col-12 col-md-3">
              <q-card flat bordered class="tarjeta-filtros q-pa-md">
                <div class="row items-center justify-between q-mb-md">
                  <div class="text-subtitle1 text-weight-bold">Filtros</div>
                  <q-btn
                    v-if="hayFiltrosActivos"
                    flat dense size="sm" no-caps icon="filter_alt_off" color="primary"
                    label="Limpiar"
                    @click="limpiarFiltros"
                  />
                </div>

                <q-input
                  v-model="termino"
                  outlined dense clearable label="Buscar por nombre"
                  debounce="200"
                  class="q-mb-lg campo-busqueda"
                >
                  <template #prepend>
                    <q-icon name="search" color="primary" />
                  </template>
                </q-input>

                <div class="grupo-filtro q-mb-lg">
                  <div class="etiqueta-filtro row items-center">
                    <q-icon name="category" size="16px" class="q-mr-xs" />
                    Categoria
                  </div>
                  <q-list class="q-mt-xs">
                    <q-item
                      clickable v-ripple
                      class="opcion-filtro rounded-borders"
                      :class="{ 'opcion-filtro--activa': categoriaFiltro === null }"
                      @click="categoriaFiltro = null"
                    >
                      <q-item-section>Todas</q-item-section>
                    </q-item>
                    <q-item
                      v-for="cat in categorias"
                      :key="cat._id"
                      clickable v-ripple
                      class="opcion-filtro rounded-borders"
                      :class="{ 'opcion-filtro--activa': categoriaFiltro === cat.slug }"
                      @click="categoriaFiltro = cat.slug"
                    >
                      <q-item-section>{{ cat.nombre }}</q-item-section>
                    </q-item>
                  </q-list>
                </div>

                <div class="grupo-filtro">
                  <div class="etiqueta-filtro row items-center">
                    <q-icon name="local_shipping" size="16px" class="q-mr-xs" />
                    Proveedor
                  </div>
                  <q-list class="q-mt-xs">
                    <q-item
                      clickable v-ripple
                      class="opcion-filtro rounded-borders"
                      :class="{ 'opcion-filtro--activa': proveedorFiltro === null }"
                      @click="proveedorFiltro = null"
                    >
                      <q-item-section>Todos</q-item-section>
                    </q-item>
                    <q-item
                      v-for="prov in proveedores"
                      :key="prov._id"
                      clickable v-ripple
                      class="opcion-filtro rounded-borders"
                      :class="{ 'opcion-filtro--activa': proveedorFiltro === prov._id }"
                      @click="proveedorFiltro = prov._id"
                    >
                      <q-item-section>{{ prov.nombre }}</q-item-section>
                    </q-item>
                  </q-list>
                </div>
              </q-card>
            </div>

            <!-- Grid de productos -->
            <div class="col-12 col-md-9">
              <transition name="fade-esqueleto" mode="out-in">
                <!-- Esqueleto de carga -->
                <div v-if="mostrarEsqueleto" key="esqueleto" class="row q-col-gutter-md">
                  <div v-for="n in 6" :key="n" class="col-12 col-sm-6 col-lg-4">
                    <q-card flat bordered class="esqueleto-card">
                      <q-skeleton type="rect" height="160px" animation="wave" />
                      <q-card-section>
                        <q-skeleton type="text" width="80%" animation="wave" class="q-mb-sm" />
                        <q-skeleton type="text" width="40%" animation="wave" class="q-mb-md" />
                        <q-skeleton type="text" width="60%" animation="wave" class="q-mb-xs" />
                        <q-skeleton type="text" width="55%" animation="wave" />
                      </q-card-section>
                    </q-card>
                  </div>
                </div>

                <!-- Estado vacio -->
                <div
                  v-else-if="productosFiltrados.length === 0"
                  key="vacio"
                  class="column flex-center q-py-xl estado-vacio"
                >
                  <q-icon name="inbox" size="64px" color="grey-4" class="q-mb-sm" />
                  <span class="empty-title">No hay productos que coincidan con los filtros</span>
                  <q-btn
                    v-if="hayFiltrosActivos"
                    flat no-caps color="primary" label="Limpiar filtros" class="q-mt-sm"
                    @click="limpiarFiltros"
                  />
                </div>

                <!-- Grid real -->
                <div v-else key="grid" class="row q-col-gutter-md">
                  <div
                    v-for="(producto, indice) in productosFiltrados"
                    :key="producto._id"
                    class="col-12 col-sm-6 col-lg-4 producto-animado"
                    :style="{ animationDelay: `${Math.min(indice, 8) * 50}ms` }"
                  >
                    <div class="producto-envoltorio">
                      <ProductoCard
                        :producto="producto"
                        :categoria-nombre="categoriaNombre(producto.categoria)"
                        :proveedor-nombre="proveedorNombre(producto.proveedorId)"
                      />
                    </div>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>
<style scoped lang="scss">
.fondo-catalogo {
  background: #f7f8f7;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

// ---- Decoraciones de fondo -------------------------------------------------

.blob {
  position: absolute;
  border-radius: 42% 58% 65% 35% / 45% 40% 60% 55%;
  filter: blur(2px);
  z-index: 0;
  pointer-events: none;

  &--uno {
    width: 340px;
    height: 340px;
    top: -140px;
    right: -140px;
    opacity: 0.08;
  }

  &--dos {
    width: 220px;
    height: 220px;
    bottom: -100px;
    left: -90px;
    opacity: 0.06;
  }
}

.patron-puntos {
  position: absolute;
  top: 0;
  right: 0;
  width: 220px;
  height: 220px;
  background-image: radial-gradient(var(--q-primary) 1.5px, transparent 1.5px);
  background-size: 18px 18px;
  opacity: 0.08;
  z-index: 0;
  pointer-events: none;
}

// ---- Encabezado -------------------------------------------------------------

.encabezado-catalogo {
  padding-top: 8px;
}

.marco-icono-titulo {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--q-primary) 0%, #1f5c22 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 6px 16px -6px rgba(16, 40, 20, 0.35);
}

.linea-titulo {
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--q-primary) 0%, rgba(33, 115, 40, 0.15) 100%);
  margin-top: 16px;
}

// ---- Filtros -----------------------------------------------------------------

.tarjeta-filtros {
  border-radius: 14px;
  position: sticky;
  top: 16px;
}

.campo-busqueda :deep(.q-field__control) {
  border-radius: 10px;
}

.etiqueta-filtro {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--q-primary);
}

.opcion-filtro {
  min-height: 36px;
  color: rgba(0, 0, 0, 0.72);
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease;

  &:hover {
    background-color: rgba(var(--q-primary-rgb, 33, 115, 40), 0.06);
    transform: translateX(2px);
  }

  &--activa {
    background-color: rgba(var(--q-primary-rgb, 33, 115, 40), 0.1);
    color: var(--q-primary);
    font-weight: 600;
    border-left: 3px solid var(--q-primary);
    padding-left: calc(16px - 3px);
  }
}

// ---- Grid de productos ---------------------------------------------------

.producto-envoltorio {
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-4px);
  }
}

.producto-animado {
  opacity: 0;
  animation: entrar-producto 0.35s ease forwards;
}

@keyframes entrar-producto {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .producto-animado {
    animation: none;
    opacity: 1;
  }
  .producto-envoltorio:hover {
    transform: none;
  }
}

.esqueleto-card {
  border-radius: 12px;
  overflow: hidden;
}

.estado-vacio {
  min-height: 260px;
}

.fade-esqueleto-enter-active,
.fade-esqueleto-leave-active {
  transition: opacity 0.2s ease;
}

.fade-esqueleto-enter-from,
.fade-esqueleto-leave-to {
  opacity: 0;
}
</style>