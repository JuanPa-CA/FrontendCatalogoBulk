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
        class="full-width imagen-zoom"
      />
      <div v-else class="producto-card__placeholder">
        <q-icon name="image" size="48px" color="grey-4" />
      </div>

      <q-badge
        class="insignia-flotante"
        :color="estaDisponible ? 'positive' : 'grey-8'"
        :label="estaDisponible ? 'Disponible' : 'Agotado'"
      />
    </div>

    <q-card-section>
      <div class="titulo-producto">{{ producto.nombre }}</div>

      <div class="text-caption texto-suave ellipsis q-mt-xs" v-if="producto.sku">
        SKU: {{ producto.sku }}
      </div>

      <div class="precio-producto q-mt-sm">{{ formatMoneda(producto.precio) }}</div>

      <div class="q-mt-sm text-caption texto-suave meta-producto">
        <div v-if="categoriaNombre" class="ellipsis row items-center no-wrap">
          <q-icon name="category" size="14px" class="q-mr-xs" />{{ categoriaNombre }}
        </div>
        <div v-if="proveedorNombre" class="ellipsis row items-center no-wrap q-mt-xs">
          <q-icon name="local_shipping" size="14px" class="q-mr-xs" />{{ proveedorNombre }}
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped lang="scss">
.producto-card {
  &__imagen {
    position: relative;
    border-bottom: 1px solid #e0e0e0;
    overflow: hidden;
  }

  &__placeholder {
    aspect-ratio: 4/3;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fafafa;
  }
}

.imagen-zoom {
  transition: transform 0.35s ease;

  .producto-card:hover & {
    transform: scale(1.05);
  }
}

@media (prefers-reduced-motion: reduce) {
  .imagen-zoom {
    transition: none;

    .producto-card:hover & {
      transform: none;
    }
  }
}

.insignia-flotante {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 0.72rem;
  padding: 5px 10px;
  border-radius: 999px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
}

.titulo-producto {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: calc(1.3em * 2);
}

.precio-producto {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--q-primary);
  letter-spacing: -0.01em;
}

.meta-producto {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  padding-top: 8px;
}
</style>