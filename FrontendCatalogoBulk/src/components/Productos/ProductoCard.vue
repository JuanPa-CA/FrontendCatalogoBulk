<script setup>

import { computed } from "vue";
import { formatMoneda } from "@/utils/formatMoneda";

const props = defineProps({
  producto: {
    type: Object,
    required: true,
  },
  categoriaNombre: {
    type: String,
    default: "",
  },
  proveedorNombre: {
    type: String,
    default: "",
  },
});

const estaDisponible = computed(() => Boolean(props.producto.disponible));
</script>

<template>
  <q-card flat class="producto-card tarjeta tarjeta-hover result-card full-height">
    <div class="producto-card__imagen">
      <q-img
        v-if="producto.imagenUrl"
        :src="producto.imagenUrl"
        :alt="producto.nombre"
        :ratio="4/3"
        class="full-width"
      />
      <div v-else class="producto-card__placeholder">
        <q-icon name="image" size="48px" color="grey-4" />
      </div>
    </div>

    <q-card-section>
      <div class="row items-center no-wrap q-mb-xs">
        <div class="text-subtitle1 text-weight-bold ellipsis">{{ producto.nombre }}</div>
        <q-space />
        <q-badge
          :color="estaDisponible ? 'positive' : 'grey-6'"
          :label="estaDisponible ? 'Disponible' : 'Agotado'"
        />
      </div>

      <div class="text-caption texto-suave ellipsis" v-if="producto.sku">
        SKU: {{ producto.sku }}
      </div>

      <div class="row items-center q-mt-sm q-gutter-x-md">
        <div class="text-h6 text-weight-bold">{{ formatMoneda(producto.precio) }}</div>
      </div>

      <div class="q-mt-sm text-caption texto-suave">
        <div v-if="categoriaNombre" class="ellipsis">
          <q-icon name="category" size="14px" class="q-mr-xs" />{{ categoriaNombre }}
        </div>
        <div v-if="proveedorNombre" class="ellipsis q-mt-xs">
          <q-icon name="local_shipping" size="14px" class="q-mr-xs" />{{ proveedorNombre }}
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped lang="scss">
.producto-card {
  &__imagen {
    border-bottom: 1px solid #e0e0e0;
  }

  &__placeholder {
    aspect-ratio: 4/3;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fafafa;
  }
}
</style>
