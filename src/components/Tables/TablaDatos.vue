<script setup>

import { computed, ref, useSlots } from "vue";

const props = defineProps({
  filas: {
    type: Array,
    required: true,
  },
  columnas: {
    type: Array,
    required: true,
  },
  cargando: {
    type: Boolean,
    default: false,
  },
  filaClave: {
    type: String,
    default: "_id",
  },
  mensajeVacio: {
    type: String,
    default: "No hay registros para mostrar",
  },
  // Si se pasa, la busqueda ("Buscar...") solo compara estas columnas (por su
  // `name`). Si no, filtra por todas las columnas como antes.
  columnasBusqueda: {
    type: Array,
    default: null,
  },
});

const busqueda = ref("");

// Si se indican columnasBusqueda, se filtra acá mismo (solo esas columnas) y
// se le pasa a q-table :filter=null para que no vuelva a filtrar. Si no,
// q-table filtra por todas con :filter=busqueda.
const filasFiltradas = computed(() => {
  if (!props.columnasBusqueda || props.columnasBusqueda.length === 0) {
    return props.filas;
  }

  const texto = busqueda.value.trim().toLowerCase();
  if (!texto) return props.filas;

  return props.filas.filter((fila) =>
    props.columnasBusqueda.some((nombreCol) => {
      const col = props.columnas.find((c) => c.name === nombreCol);
      if (!col) return false;
      const valor =
        typeof col.field === "function" ? col.field(fila) : fila[col.field];
      return String(valor ?? "").toLowerCase().includes(texto);
    })
  );
});

const slotsPropios = ["default", "top", "no-data", "acciones-tabla"];

const slots = useSlots();

const slotsReenviados = computed(() =>
  Object.keys(slots).filter((nombre) => !slotsPropios.includes(nombre))
);
</script>

<template>
  <q-table
    :rows="filasFiltradas"
    :columns="columnas"
    :row-key="filaClave"
    :loading="cargando"
    :filter="props.columnasBusqueda ? null : busqueda"
    :rows-per-page-options="[10, 25, 50, 0]"
    :no-data-label="mensajeVacio"
    no-results-label="Ningun registro coincide con la busqueda"
    loading-label="Consultando al servidor..."
    rows-per-page-label="Registros por pagina"
    flat
    bordered
    class="tabla-datos my-sticky-header-table"
  >
    <template #top>
      <div class="row full-width items-center q-col-gutter-sm">
        <div class="col-12 col-sm-5">
          <q-input
            v-model="busqueda"
            dense
            outlined
            clearable
            debounce="300"
            placeholder="Buscar..."
            class="campo-busqueda-tabla"
            color="primary"
          >
            <template #prepend>
              <q-icon name="search" color="primary" />
            </template>
          </q-input>
        </div>

        <q-space class="gt-xs" />

        <div class="col-12 col-sm-auto">
          <slot name="acciones-tabla" />
        </div>
      </div>
    </template>

    <template
      v-for="nombre in slotsReenviados"
      :key="nombre"
      #[nombre]="datosDelSlot"
    >
      <slot :name="nombre" v-bind="datosDelSlot || {}" />
    </template>

    <template #loading>
      <q-inner-loading showing color="primary">
        <q-spinner-dots color="primary" size="42px" />
      </q-inner-loading>
    </template>

    <template #no-data>
      <div class="full-width column flex-center q-py-xl">
        <q-icon name="inbox" size="64px" color="grey-4" class="q-mb-sm icono-vacio" />
        <span class="empty-title">{{ mensajeVacio }}</span>
      </div>
    </template>
  </q-table>
</template>

<style scoped lang="scss">
.tabla-datos {
  border-radius: 14px;
  border-color: rgba(0, 0, 0, 0.08);

  :deep(thead tr th) {
    position: sticky;
    top: 0;
    z-index: 1;
    background: #fafbfa;
    font-size: 0.76rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: rgba(0, 0, 0, 0.6);
    padding: 14px 16px;
    box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.08);
  }

  :deep(tbody tr td) {
    padding: 14px 16px;
    font-size: 0.92rem;
  }

  :deep(tbody tr) {
    transition: background-color 0.12s ease;

    &:hover {
      background-color: rgba(var(--q-primary-rgb, 33, 115, 40), 0.045);
    }
  }

  :deep(.q-table__bottom) {
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    padding: 10px 16px;
  }
}

.campo-busqueda-tabla :deep(.q-field__control) {
  border-radius: 10px;
}

.icono-vacio {
  animation: flotar-suave 2.6s ease-in-out infinite;
}

@keyframes flotar-suave {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .icono-vacio {
    animation: none;
  }
}
</style>