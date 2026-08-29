<script setup>

defineProps({
  titulo: {
    type: String,
    required: true,
  },
  subtitulo: {
    type: String,
    default: "",
  },
  icono: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <header class="encabezado-pagina">
    <div class="row items-center justify-between q-col-gutter-md">
      <div class="col-12 col-sm">
        <div class="row items-center no-wrap">
          <div v-if="icono" class="encabezado-pagina__icono">
            <q-icon :name="icono" size="24px" color="white" />
          </div>

          <div>
            <h1 class="titulo-vista style-text encabezado-pagina__titulo">{{ titulo }}</h1>
            <p v-if="subtitulo" class="encabezado-pagina__subtitulo">
              {{ subtitulo }}
            </p>
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-auto">
        <slot name="acciones" />
      </div>
    </div>

    <div class="encabezado-pagina__linea"></div>
  </header>
</template>

<style scoped lang="scss">
.encabezado-pagina {
  margin-bottom: 24px;
  opacity: 0;
  animation: encabezado-entrar 0.4s ease forwards;

  &__icono {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: linear-gradient(135deg, var(--q-primary) 0%, #1f5c22 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-right: 16px;
    box-shadow: 0 6px 16px -6px rgba(16, 40, 20, 0.35);
  }

  &__titulo {
    margin: 0;
    font-weight: 800;
    letter-spacing: -0.01em;
    line-height: 1.2;
  }

  &__subtitulo {
    font-size: 14px;
    color: #616161;
    margin: 4px 0 0;
  }

  &__linea {
    height: 3px;
    width: 100%;
    border-radius: 999px;
    margin-top: 20px;
    background: linear-gradient(90deg, var(--q-primary) 0%, rgba(33, 115, 40, 0.15) 100%);
    transform-origin: left;
    animation: linea-crecer 0.5s ease 0.1s both;
  }
}

@keyframes encabezado-entrar {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes linea-crecer {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .encabezado-pagina {
    opacity: 1;
    animation: none;

    &__linea {
      animation: none;
    }
  }
}
</style>