<script setup>
/**
 * /views/ProveedoresView.vue
 * CRUD de proveedores. Campos: nombre, slug, contactoEmail, logoUrl, activo.
 *
 * Endpoints:
 *   GET    /proveedores        listar (query: page, limit, activo)
 *   POST   /proveedores        crear
 *   PUT    /proveedores/:id    editar
 *   DELETE /proveedores/:id    borrar (409 si tiene productos)
 */
import { computed, onMounted, ref } from "vue";

import EncabezadoPagina from "@/components/Encabezados/EncabezadoPagina.vue";
import TablaDatos from "@/components/Tables/TablaDatos.vue";

import { get, post, put, del } from "@/services/api.service";
import { extraerLista } from "@/utils/normalizar";
import { useGeneralStore } from "@/store/General";
import { useNotificar } from "@/composables/useNotificar";
import { useConfirmar } from "@/composables/useConfirmar";
import { requerido, minimo, esEmail, esSlug, esUrl } from "@/utils/reglas";

const general = useGeneralStore();
const { notificarOk, notificarError } = useNotificar();
const { confirmar } = useConfirmar();

const columnas = [
  { name: "nombre", label: "Nombre", field: "nombre", align: "left", sortable: true },
  { name: "slug", label: "Slug", field: "slug", align: "left", sortable: true },
  { name: "contactoEmail", label: "Email", field: "contactoEmail", align: "left", sortable: true },
  { name: "logoUrl", label: "Logo", field: "logoUrl", align: "left" },
  { name: "activo", label: "Estado", field: "activo", align: "center", sortable: true },
  { name: "acciones", label: "Acciones", field: "acciones", align: "right" },
];

const proveedores = ref([]);
const cargando = ref(false);
const error = ref(null);

const cargar = async () => {
  cargando.value = true;
  error.value = null;

  try {
    const respuesta = await get("/proveedores?limit=1000");
    proveedores.value = extraerLista(respuesta);
    general.marcarSincronizacion();
  } catch (e) {
    error.value = e.mensaje;
    notificarError(e);
  } finally {
    cargando.value = false;
  }
};

onMounted(cargar);

// --- Formulario ----------------------------------------------------------
const dialogo = ref(false);
const guardando = ref(false);
const proveedorEditando = ref(null);
const formularioRef = ref(null);

const formulario = ref({ nombre: "", slug: "", contactoEmail: "", logoUrl: "" });

const esEdicion = computed(() => proveedorEditando.value !== null);

const formularioVacio = () => ({ nombre: "", slug: "", contactoEmail: "", logoUrl: "" });

const abrirCreacion = () => {
  proveedorEditando.value = null;
  formulario.value = formularioVacio();
  dialogo.value = true;
};

const abrirEdicion = (proveedor) => {
  proveedorEditando.value = proveedor;
  formulario.value = {
    nombre: proveedor.nombre,
    slug: proveedor.slug,
    contactoEmail: proveedor.contactoEmail || "",
    logoUrl: proveedor.logoUrl || "",
  };
  dialogo.value = true;
};

const guardar = async () => {
  guardando.value = true;

  try {
    const datos = {
      nombre: formulario.value.nombre.trim(),
      slug: formulario.value.slug.trim(),
      contactoEmail: formulario.value.contactoEmail.trim() || undefined,
      logoUrl: formulario.value.logoUrl.trim() || undefined,
    };

    const respuesta = esEdicion.value
      ? await put(`/proveedores/${proveedorEditando.value._id}`, datos)
      : await post("/proveedores", datos);

    notificarOk(respuesta.msg || "Proveedor guardado");
    dialogo.value = false;
    await cargar();
  } catch (e) {
    notificarError(e);
  } finally {
    guardando.value = false;
  }
};

// --- Activar / desactivar y borrar --------------------------------------
const cambiarEstado = async (proveedor) => {
  const activo = proveedor.activo !== false;

  const aceptado = await confirmar({
    titulo: activo ? "Desactivar proveedor" : "Activar proveedor",
    mensaje: `¿Confirmas ${activo ? "desactivar" : "activar"} a ${proveedor.nombre}?`,
    textoOk: activo ? "Desactivar" : "Activar",
    color: activo ? "negative" : "primary",
  });

  if (!aceptado) return;

  try {
    const respuesta = await put(`/proveedores/${proveedor._id}`, {
      nombre: proveedor.nombre,
      slug: proveedor.slug,
      contactoEmail: proveedor.contactoEmail,
      logoUrl: proveedor.logoUrl,
      activo: !activo,
    });

    notificarOk(respuesta.msg || "Estado actualizado");
    await cargar();
  } catch (e) {
    notificarError(e);
  }
};

const eliminar = async (proveedor) => {
  const aceptado = await confirmar({
    titulo: "Eliminar proveedor",
    mensaje: `¿Confirmas eliminar a ${proveedor.nombre}? Esta accion no se puede deshacer.`,
    textoOk: "Eliminar",
    color: "negative",
  });

  if (!aceptado) return;

  try {
    const respuesta = await del(`/proveedores/${proveedor._id}`);
    notificarOk(respuesta.msg || "Proveedor eliminado");
    await cargar();
  } catch (e) {
    // Un 409 llega cuando el proveedor tiene productos asociados.
    notificarError(e);
  }
};
</script>

<template>
  <q-page>
    <div class="contenedor-app">
      <EncabezadoPagina
        titulo="Proveedores"
        subtitulo="Empresas que abastecen el catalogo"
        icono="local_shipping"
      >
        <template #acciones>
          <q-btn
            unelevated
            no-caps
            color="primary"
            icon="add"
            label="Nuevo proveedor"
            @click="abrirCreacion"
          />
        </template>
      </EncabezadoPagina>

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
        :filas="proveedores"
        :columnas="columnas"
        :cargando="cargando"
        mensaje-vacio="Aun no hay proveedores registrados"
      >
        <template #body-cell-logoUrl="celda">
          <q-td :props="celda" class="text-left">
            <a
              v-if="celda.row.logoUrl"
              :href="celda.row.logoUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary"
            >Ver logo</a>
            <span v-else class="text-grey-6">-</span>
          </q-td>
        </template>

        <template #body-cell-activo="celda">
          <q-td :props="celda" class="text-center">
            <q-badge
              :color="celda.row.activo !== false ? 'positive' : 'grey-6'"
              :label="celda.row.activo !== false ? 'Activo' : 'Inactivo'"
            />
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

            <q-btn
              flat dense round size="sm" class="action-secondary"
              :icon="celda.row.activo !== false ? 'toggle_on' : 'toggle_off'"
              :color="celda.row.activo !== false ? 'negative' : 'positive'"
              @click="cambiarEstado(celda.row)"
            >
              <q-tooltip>
                {{ celda.row.activo !== false ? "Desactivar" : "Activar" }}
              </q-tooltip>
            </q-btn>

            <q-btn
              flat dense round size="sm" icon="delete" color="negative"
              class="action-secondary"
              @click="eliminar(celda.row)"
            >
              <q-tooltip>Eliminar</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </TablaDatos>
    </div>

    <q-dialog v-model="dialogo" persistent @show="formularioRef?.resetValidation()">
      <q-card class="dialog-card">
        <q-card-section class="bg-primary text-white row items-center no-wrap q-px-lg q-py-md">
          <q-icon :name="esEdicion ? 'edit' : 'add'" size="28px" class="q-mr-md" />

          <div>
            <div class="dialog-title">{{ esEdicion ? "Editar proveedor" : "Nuevo proveedor" }}</div>
            <div class="text-caption text-green-2">Empresas que abastecen el catalogo</div>
          </div>

          <q-space />
          <q-btn v-close-popup flat round dense icon="close" color="white" />
        </q-card-section>

        <q-form ref="formularioRef" greedy @submit="guardar">
          <q-card-section class="q-gutter-md">
            <q-input
              v-model="formulario.nombre"
              outlined dense label="Nombre *"
              :rules="[requerido('El nombre'), minimo(2, 'El nombre')]"
              lazy-rules
            />

            <q-input
              v-model="formulario.slug"
              outlined dense label="Slug *"
              hint="Minusculas, sin espacios. Ej: acme-corp"
              :rules="[requerido('El slug'), esSlug('El slug')]"
              lazy-rules
            />

            <q-input
              v-model="formulario.contactoEmail"
              outlined dense type="email" label="Email de contacto"
              hint="Opcional"
              :rules="[esEmail()]"
              lazy-rules
            />

            <q-input
              v-model="formulario.logoUrl"
              outlined dense label="URL del logo"
              hint="Opcional. Ej: https://.../logo.png"
              :rules="[esUrl()]"
              lazy-rules
            />
          </q-card-section>

          <q-card-actions align="right" class="q-px-md q-pb-md">
            <q-btn v-close-popup flat no-caps label="Cancelar" color="dark" class="btn-cancel" />
            <q-btn
              unelevated no-caps type="submit" color="primary" class="btn-ok"
              :label="esEdicion ? 'Guardar cambios' : 'Registrar proveedor'"
              :loading="guardando"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>
