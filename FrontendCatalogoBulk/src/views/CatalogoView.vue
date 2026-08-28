<script setup>
/**
 * /views/CatalogoView.vue
 * Vista tipo e-commerce: grid de productos con filtros laterales por categoria
 * y proveedor, y buscador por nombre.
 *
 * Los filtros se aplican en el cliente (sobre la lista ya cargada) para que la
 * respuesta sea instantanea al seleccionar. La API tambien acepta los query
 * categoria / proveedor / disponible si se quisiera filtrar del lado del servidor.
 */
import { computed, onMounted, ref } from "vue";

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
</script>

<template>
  <q-page>
    <div class="contenedor-app">
      <header class="catalogo-encabezado q-mb-md">
        <div>
          <h1 class="titulo-vista style-text">Catalogo</h1>
          <p class="texto-suave q-mb-none">Explora los productos disponibles</p>
        </div>
        <hr class="linea-titulo" />
      </header>

      <q-banner v-if="error" dense class="bg-red-1 text-negative q-mb-md rounded-borders">
        <template #avatar>
          <q-icon name="error_outline" />
        </template>
        {{ error }}
        <template #action>
          <q-btn flat dense no-caps label="Reintentar" @click="cargar" />
        </template>
      </q-banner>

      <div class="row q-col-gutter-lg">
        <!-- Filtros laterales -->
        <div class="col-12 col-md-3">
          <q-card flat class="tarjeta q-pa-md">
            <div class="row items-center justify-between q-mb-md">
              <div class="text-subtitle1 text-weight-bold">Filtros</div>
              <q-btn
                flat dense size="sm" no-caps icon="filter_alt_off" color="primary"
                label="Limpiar"
                @click="limpiarFiltros"
              />
            </div>

            <q-input
              v-model="termino"
              outlined dense clearable label="Buscar por nombre"
              debounce="200"
              class="q-mb-md"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>

            <div class="data-label">Categoria</div>
            <q-list dense class="q-mb-md">
              <q-item
                clickable v-ripple :active="categoriaFiltro === null" active-class="text-primary"
                @click="categoriaFiltro = null"
              >
                <q-item-section>Todas</q-item-section>
              </q-item>
              <q-item
                v-for="cat in categorias"
                :key="cat._id"
                clickable v-ripple
                :active="categoriaFiltro === cat.slug"
                active-class="text-primary"
                @click="categoriaFiltro = cat.slug"
              >
                <q-item-section>{{ cat.nombre }}</q-item-section>
              </q-item>
            </q-list>

            <div class="data-label">Proveedor</div>
            <q-list dense>
              <q-item
                clickable v-ripple :active="proveedorFiltro === null" active-class="text-primary"
                @click="proveedorFiltro = null"
              >
                <q-item-section>Todos</q-item-section>
              </q-item>
              <q-item
                v-for="prov in proveedores"
                :key="prov._id"
                clickable v-ripple
                :active="proveedorFiltro === prov._id"
                active-class="text-primary"
                @click="proveedorFiltro = prov._id"
              >
                <q-item-section>{{ prov.nombre }}</q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </div>

        <!-- Grid de productos -->
        <div class="col-12 col-md-9">
          <div v-if="cargando" class="row justify-center q-py-xl">
            <q-spinner color="primary" size="3em" />
          </div>

          <div v-else-if="productosFiltrados.length === 0" class="column flex-center q-py-xl">
            <q-icon name="inbox" size="64px" color="grey-4" class="q-mb-sm" />
            <span class="empty-title">No hay productos que coincidan con los filtros</span>
          </div>

          <div v-else class="row q-col-gutter-md">
            <div
              v-for="producto in productosFiltrados"
              :key="producto._id"
              class="col-12 col-sm-6 col-lg-4"
            >
              <ProductoCard
                :producto="producto"
                :categoria-nombre="categoriaNombre(producto.categoria)"
                :proveedor-nombre="proveedorNombre(producto.proveedorId)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<style scoped lang="scss">
.catalogo-encabezado {
  margin-bottom: 24px;
}
</style>
