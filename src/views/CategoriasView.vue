<script setup>

import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

import EncabezadoPagina from "@/components/Encabezados/EncabezadoPagina.vue";
import TablaDatos from "@/components/Tables/TablaDatos.vue";

import { get, put } from "@/services/api.service";
import { extraerLista } from "@/utils/normalizar";
import { useGeneralStore } from "@/store/General";
import { useNotificar } from "@/composables/useNotificar";
import { requerido, minimo, esUrl } from "@/utils/reglas";

const general = useGeneralStore();
const { notificarOk, notificarError } = useNotificar();

const columnas = [
  { name: "slug", label: "Slug", field: "slug", align: "left", sortable: true },
  { name: "nombre", label: "Nombre", field: "nombre", align: "left", sortable: true },
  { name: "descripcion", label: "Descripcion", field: "descripcion", align: "left" },
  { name: "imagenUrl", label: "Imagen", field: "imagenUrl", align: "left" },
  { name: "acciones", label: "Acciones", field: "acciones", align: "right" },
];

const categorias = ref([]);
const cargando = ref(false);
const error = ref(null);

const cargar = async () => {
  cargando.value = true;
  error.value = null;

  try {
    const respuesta = await get("/categorias");
    categorias.value = extraerLista(respuesta);
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
const anchosEsqueleto = ["60%", "70%", "80%", "50%", "40%"];
const anchoEsqueleto = (indice) => anchosEsqueleto[indice % anchosEsqueleto.length];
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


const dialogo = ref(false);
const guardando = ref(false);
const categoriaEditando = ref(null);
const formularioRef = ref(null);

const formulario = ref({ nombre: "", descripcion: "", imagenUrl: "" });

const abrirEdicion = (categoria) => {
  categoriaEditando.value = categoria;
  formulario.value = {
    nombre: categoria.nombre,
    descripcion: categoria.descripcion || "",
    imagenUrl: categoria.imagenUrl || "",
  };
  dialogo.value = true;
};

const guardar = async () => {
  guardando.value = true;

  try {
    const datos = {
      nombre: formulario.value.nombre.trim(),
      descripcion: formulario.value.descripcion.trim() || null,
      imagenUrl: formulario.value.imagenUrl.trim() || null,
    };

    const respuesta = await put(`/categorias/${categoriaEditando.value._id}`, datos);

    notificarOk(respuesta.msg || "Categoria actualizada");
    dialogo.value = false;
    await cargar();
  } catch (e) {
    notificarError(e);
  } finally {
    guardando.value = false;
  }
};
</script>

<template>
  <q-page>
    <div class="contenedor-app">
      <EncabezadoPagina
        titulo="Categorias"
        subtitulo="Se crean automaticamente al importar productos"
        icono="category"
      />

      <q-banner v-if="error" dense class="bg-red-1 text-negative q-mb-md rounded-borders">
        <template #avatar>
          <q-icon name="error_outline" />
        </template>
        {{ error }}
        <template #action>
          <q-btn flat dense no-caps label="Reintentar" @click="cargar" />
        </template>
      </q-banner>

      <transition name="fade-esqueleto" mode="out-in">
        <div v-if="mostrarEsqueleto" key="esqueleto" class="esqueleto-tabla">
          <q-card flat bordered class="rounded-borders-lg">
            <q-card-section>
              <q-skeleton type="QInput" class="esqueleto-buscador" />
            </q-card-section>

            <q-separator />

            <div class="esqueleto-encabezado q-px-md q-py-sm">
              <span
                v-for="columna in columnas"
                :key="columna.name"
                class="esqueleto-col text-caption text-weight-bold text-grey-7"
              >
                {{ columna.label }}
              </span>
            </div>

            <q-separator />

            <div
              v-for="fila in 5"
              :key="fila"
              class="esqueleto-fila q-px-md q-py-md"
            >
              <q-skeleton
                v-for="(columna, indice) in columnas"
                :key="columna.name"
                type="text"
                animation="wave"
                class="esqueleto-col"
                :width="anchoEsqueleto(indice)"
              />
            </div>
          </q-card>
        </div>

        <TablaDatos
          v-else
          key="tabla"
          :filas="categorias"
          :columnas="columnas"
          :cargando="cargando"
          mensaje-vacio="Aun no hay categorias registradas"
          class="tabla-categorias"
        >
          <template #body-cell-descripcion="celda">
            <q-td :props="celda" class="text-left">
              <span v-if="celda.row.descripcion" class="text-grey-7">{{ celda.row.descripcion }}</span>
              <span v-else class="text-grey-6">-</span>
            </q-td>
          </template>

          <template #body-cell-imagenUrl="celda">
            <q-td :props="celda" class="text-left">
              <a
                v-if="celda.row.imagenUrl"
                :href="celda.row.imagenUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary"
              >Ver imagen</a>
              <span v-else class="text-grey-6">-</span>
            </q-td>
          </template>

          <template #body-cell-acciones="celda">
            <q-td :props="celda" class="text-right">
              <q-btn
                flat round size="md" icon="edit" color="primary"
                class="action-secondary"
                @click="abrirEdicion(celda.row)"
              >
                <q-tooltip>Editar</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </TablaDatos>
      </transition>
    </div>

    <q-dialog v-model="dialogo" persistent @show="formularioRef?.resetValidation()">
      <q-card class="dialog-card">
        <q-card-section class="bg-primary text-white row items-center no-wrap q-px-lg q-py-md">
          <q-icon name="edit" size="28px" class="q-mr-md" />

          <div>
            <div class="dialog-title">Editar categoria</div>
            <div class="text-caption text-green-2">El slug no se puede cambiar</div>
          </div>

          <q-space />
          <q-btn v-close-popup flat round dense icon="close" color="white" />
        </q-card-section>

        <q-form ref="formularioRef" greedy @submit="guardar">
          <q-card-section class="q-gutter-md">
            <q-input
              :model-value="categoriaEditando?.slug"
              outlined dense label="Slug"
              readonly
              disable
              hint="El slug es inmutable: lo usa el catalogo y el import"
            />

            <q-input
              v-model="formulario.nombre"
              outlined dense label="Nombre *"
              :rules="[requerido('El nombre'), minimo(2, 'El nombre')]"
              lazy-rules
            />

            <q-input
              v-model="formulario.descripcion"
              outlined dense type="textarea" label="Descripcion"
              hint="Opcional"
              autogrow
            />

            <q-input
              v-model="formulario.imagenUrl"
              outlined dense label="URL de la imagen"
              hint="Opcional. Ej: https://.../electronica.jpg"
              :rules="[esUrl()]"
              lazy-rules
            />
          </q-card-section>

          <q-card-actions align="right" class="q-px-md q-pb-md">
            <q-btn v-close-popup flat no-caps label="Cancelar" color="dark" class="btn-cancel" />
            <q-btn
              unelevated no-caps type="submit" color="primary" class="btn-ok"
              label="Guardar cambios"
              :loading="guardando"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style scoped lang="scss">
// La tabla vive dentro de TablaDatos (componente hijo), asi que ajustamos
// su spacing/tipografia desde afuera con :deep() en vez de tocar ese componente.
.tabla-categorias {
  :deep(th) {
    font-size: 0.8rem;
    padding: 14px 16px;
  }

  :deep(td) {
    font-size: 0.92rem;
    padding: 16px;
  }

  :deep(.q-table__card) {
    border-radius: 12px;
  }
}

.action-secondary {
  font-size: 1.15rem;
}

// ---- Esqueleto de carga --------------------------------------------------

.rounded-borders-lg {
  border-radius: 12px;
}

.esqueleto-buscador {
  height: 40px;
  max-width: 320px;
  border-radius: 8px;
}

.esqueleto-encabezado,
.esqueleto-fila {
  display: flex;
  align-items: center;
  gap: 16px;
}

.esqueleto-col {
  flex: 1 1 0;
  min-width: 0;
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