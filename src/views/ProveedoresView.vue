<script setup>

import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

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

// Esqueleto de carga: solo aparece si tarda mas de 300ms, para no
// generar parpadeo en cargas rapidas.
const mostrarEsqueleto = ref(false);
const anchosEsqueleto = ["80%", "55%", "70%", "40%", "60%", "55%"];
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

    notificarOk(respuesta.message || "Proveedor guardado");
    dialogo.value = false;
    await cargar();
  } catch (e) {
    notificarError(e);
  } finally {
    guardando.value = false;
  }
};

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

    notificarOk(respuesta.message || "Estado actualizado");
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
    notificarOk(respuesta.message || "Proveedor eliminado");
    await cargar();
  } catch (e) {

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
          :filas="proveedores"
          :columnas="columnas"
          :cargando="cargando"
          mensaje-vacio="Aun no hay proveedores registrados"
          class="tabla-proveedores"
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
                class="insignia-estado"
                :color="celda.row.activo !== false ? 'positive' : 'grey-6'"
                :label="celda.row.activo !== false ? 'Activo' : 'Inactivo'"
              />
            </q-td>
          </template>

          <template #body-cell-acciones="celda">
            <q-td :props="celda" class="text-right">
              <q-btn
                flat round size="md" icon="edit" color="primary"
                class="action-secondary q-mr-xs"
                @click="abrirEdicion(celda.row)"
              >
                <q-tooltip>Editar</q-tooltip>
              </q-btn>

              <q-btn
                flat round size="md" class="action-secondary q-mr-xs"
                :icon="celda.row.activo !== false ? 'toggle_on' : 'toggle_off'"
                :color="celda.row.activo !== false ? 'negative' : 'positive'"
                @click="cambiarEstado(celda.row)"
              >
                <q-tooltip>
                  {{ celda.row.activo !== false ? "Desactivar" : "Activar" }}
                </q-tooltip>
              </q-btn>

              <q-btn
                flat round size="md" icon="delete" color="negative"
                class="action-secondary"
                @click="eliminar(celda.row)"
              >
                <q-tooltip>Eliminar</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </TablaDatos>
      </transition>
    </div>

    <q-dialog v-model="dialogo" persistent @show="formularioRef?.resetValidation()">
      <q-card class="dialog-card modal-proveedor">
        <q-card-section class="cabecera-modal row items-center no-wrap">
          <div class="icono-cabecera">
            <q-icon :name="esEdicion ? 'edit' : 'add'" size="22px" />
          </div>

          <div class="q-ml-md">
            <div class="dialog-title">{{ esEdicion ? "Editar proveedor" : "Nuevo proveedor" }}</div>
            <div class="text-caption texto-cabecera">Empresas que abastecen el catalogo</div>
          </div>

          <q-space />
          <q-btn v-close-popup flat round dense icon="close" color="white" class="boton-cerrar" />
        </q-card-section>

        <q-form ref="formularioRef" greedy @submit="guardar">
          <q-card-section class="cuerpo-modal q-gutter-y-lg">
            <div>
              <div class="etiqueta-grupo">Identificacion</div>
              <div class="q-gutter-y-md">
                <q-input
                  v-model="formulario.nombre"
                  outlined label="Nombre *"
                  :rules="[requerido('El nombre'), minimo(2, 'El nombre')]"
                  lazy-rules
                />

                <q-input
                  v-model="formulario.slug"
                  outlined label="Slug *"
                  hint="Minusculas, sin espacios. Ej: acme-corp"
                  :rules="[requerido('El slug'), esSlug('El slug')]"
                  lazy-rules
                />
              </div>
            </div>

            <div>
              <div class="etiqueta-grupo">Contacto y branding</div>
              <div class="q-gutter-y-md">
                <q-input
                  v-model="formulario.contactoEmail"
                  outlined type="email" label="Email de contacto"
                  hint="Opcional"
                  :rules="[esEmail()]"
                  lazy-rules
                />

                <q-input
                  v-model="formulario.logoUrl"
                  outlined label="URL del logo"
                  hint="Opcional. Ej: https://.../logo.png"
                  :rules="[esUrl()]"
                  lazy-rules
                />
              </div>
            </div>
          </q-card-section>

          <q-card-actions align="right" class="pie-modal">
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

<style scoped lang="scss">
// La tabla vive dentro de TablaDatos (componente hijo), asi que ajustamos
// su spacing/tipografia desde afuera con :deep() en vez de tocar ese componente.
.tabla-proveedores {
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

.insignia-estado {
  font-size: 0.78rem;
  padding: 6px 12px;
  border-radius: 8px;
}

.action-secondary {
  font-size: 1.15rem;
}

// ---- Modal de proveedor ---------------------------------------------------

.modal-proveedor {
  border-radius: 16px;
  overflow: hidden;
}

.cabecera-modal {
  background: linear-gradient(120deg, var(--q-primary) 0%, #1f5c22 100%);
  color: white;
  padding: 20px 24px;
}

.icono-cabecera {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.texto-cabecera {
  color: rgba(255, 255, 255, 0.8);
}

.boton-cerrar {
  opacity: 0.85;

  &:hover {
    opacity: 1;
  }
}

.cuerpo-modal {
  padding: 24px;
  max-height: 65vh;
  overflow-y: auto;
}

.etiqueta-grupo {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--q-primary);
  margin-bottom: 10px;
}

.pie-modal {
  padding: 16px 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
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