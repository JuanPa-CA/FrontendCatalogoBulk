<script setup>
/**
 * /views/CategoriasView.vue
 * CRUD de categorias (solo lectura + edicion).
 *
 * Las categorias se crean solas (upsert) durante el import de productos, por eso
 * NO hay boton "nueva" ni endpoint POST/DELETE. Solo se listan y se editan
 * nombre, descripcion e imagenUrl (el slug NO se edita).
 *
 * Endpoints:
 *   GET /categorias        lista completa, sin paginar
 *   GET /categorias/:slug
 *   PUT /categorias/:id    editar
 */
import { computed, onMounted, ref } from "vue";

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

// --- Formulario (solo edicion) ------------------------------------------
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

      <q-banner
        dense
        class="bg-blue-1 text-blue-9 q-mb-md rounded-borders"
      >
        <template #avatar>
          <q-icon name="info" />
        </template>
        Las categorias no se crean desde aqui: el backend las genera solas
        (upsert) durante el import de productos. Aqui solo puedes editar su
        nombre, descripcion e imagen.
      </q-banner>

      <q-banner v-if="error" dense class="bg-red-1 text-negative q-mb-md rounded-borders">
        <template #avatar>
          <q-icon name="error_outline" />
        </template>
        {{ error }}
        <template #action>
          <q-btn flat dense no-caps label="Reintentar" @click="cargar" />
        </template>
      </q-banner>

      <TablaDatos
        :filas="categorias"
        :columnas="columnas"
        :cargando="cargando"
        mensaje-vacio="Aun no hay categorias registradas"
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
              flat dense round size="sm" icon="edit" color="primary"
              class="action-secondary"
              @click="abrirEdicion(celda.row)"
            >
              <q-tooltip>Editar</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </TablaDatos>
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
