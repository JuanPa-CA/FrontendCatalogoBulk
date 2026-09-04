<script setup>

import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

import EncabezadoPagina from "@/components/Encabezados/EncabezadoPagina.vue";
import TablaDatos from "@/components/Tables/TablaDatos.vue";

import { get, post, put, del } from "@/services/api.service";
import { extraerLista } from "@/utils/normalizar";
import { formatMoneda } from "@/utils/formatMoneda";
import { useGeneralStore } from "@/store/General";
import { useNotificar } from "@/composables/useNotificar";
import { useConfirmar } from "@/composables/useConfirmar";
import {
  requerido,
  minimo,
  mayorIgualA,
  enteroMayorIgualA,
  esUrl,
  seleccionRequerida,
} from "@/utils/reglas";

const general = useGeneralStore();
const { notificarOk, notificarError } = useNotificar();
const { confirmar } = useConfirmar();


const columnas = [
  { name: "sku", label: "SKU", field: "sku", align: "left", sortable: true },
  { name: "nombre", label: "Nombre", field: "nombre", align: "left", sortable: true },
  {
    name: "precio",
    label: "Precio",
    field: "precio",
    align: "right",
    sortable: true,
    format: (valor) => formatMoneda(valor),
  },
  { name: "stock", label: "Stock", field: "stock", align: "right", sortable: true },
  {
    name: "categoria",
    label: "Categoria",
    field: (fila) => categoriaNombre(fila.categoria),
    align: "left",
    sortable: true,
  },
  {
    name: "proveedor",
    label: "Proveedor",
    field: (fila) => proveedorNombre(fila.proveedorId),
    align: "left",
    sortable: true,
  },
  { name: "disponible", label: "Disponible", field: "disponible", align: "center", sortable: true },
  { name: "acciones", label: "Acciones", field: "acciones", align: "right" },
];


const productos = ref([]);
const categorias = ref([]);
const proveedores = ref([]);
const cargando = ref(false);
const error = ref(null);


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

const proveedorNombre = (id) => mapaProveedores.value[id] || "Sin proveedor";
const categoriaNombre = (slug) => mapaCategorias.value[slug] || slug || "Sin categoria";


const opcionesCategorias = computed(() =>
  categorias.value.map((c) => ({ label: c.nombre, value: c.slug }))
);


const opcionesProveedores = computed(() =>
  proveedores.value.map((p) => ({ label: p.nombre, value: p._id }))
);

const cargar = async () => {
  cargando.value = true;
  error.value = null;

  try {
    const [respProductos, respCategorias, respProveedores] = await Promise.all([
      get("/productos?limit=100"),
      get("/categorias"),
      get("/proveedores?limit=100"),
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
const anchosEsqueleto = ["85%", "60%", "70%", "45%", "75%", "65%", "55%", "70%"];
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
const productoEditando = ref(null);
const formularioRef = ref(null);

const formulario = ref({
  sku: "",
  nombre: "",
  precio: null,
  stock: 0,
  categoria: null,
  descripcion: "",
  imagenUrl: "",
  proveedorId: null,
});

const esEdicion = computed(() => productoEditando.value !== null);

const formularioVacio = () => ({
  sku: "",
  nombre: "",
  precio: null,
  stock: 0,
  categoria: null,
  descripcion: "",
  imagenUrl: "",
  proveedorId: null,
});

const abrirCreacion = () => {
  productoEditando.value = null;
  formulario.value = formularioVacio();
  dialogo.value = true;
};

const abrirEdicion = (producto) => {
  productoEditando.value = producto;
  formulario.value = {
    sku: producto.sku,
    nombre: producto.nombre,
    precio: producto.precio,
    stock: producto.stock,
    categoria: producto.categoria,
    descripcion: producto.descripcion || "",
    imagenUrl: producto.imagenUrl || "",
    proveedorId: producto.proveedorId || null,
  };
  dialogo.value = true;
};

const guardar = async () => {
  guardando.value = true;

  try {

    const datos = {
      sku: formulario.value.sku.trim(),
      nombre: formulario.value.nombre.trim(),
      precio: Number(formulario.value.precio),
      stock: Number(formulario.value.stock ?? 0),
      categoria: formulario.value.categoria,
      descripcion: formulario.value.descripcion.trim() || null,
      imagenUrl: formulario.value.imagenUrl.trim() || null,
      proveedorId: formulario.value.proveedorId,
    };

    const respuesta = esEdicion.value
      ? await put(`/productos/${productoEditando.value._id}`, datos)
      : await post("/productos", datos);

    notificarOk(respuesta.message || "Producto guardado");
    dialogo.value = false;
    await cargar();
  } catch (e) {
    notificarError(e);
  } finally {
    guardando.value = false;
  }
};

const eliminar = async (producto) => {
  const aceptado = await confirmar({
    titulo: "Eliminar producto",
    mensaje: `¿Confirmas eliminar ${producto.nombre}? Esta accion no se puede deshacer.`,
    textoOk: "Eliminar",
    color: "negative",
  });

  if (!aceptado) return;

  try {
    const respuesta = await del(`/productos/${producto._id}`);
    notificarOk(respuesta.message || "Producto eliminado");
    await cargar();
  } catch (e) {
    notificarError(e);
  }
};

// ---- Carga masiva (Bulk Import) -------------------------------------------
const dialogoImport = ref(false);
const importando = ref(false);
const formularioImportRef = ref(null);
const importForm = ref({
  proveedorId: null,
  archivo: null,
});
const importJob = ref(null);
let intervaloProgreso = null;

const abrirImportar = () => {
  importForm.value = {
    proveedorId: proveedores.value[0]?._id || null,
    archivo: null,
  };
  importJob.value = null;
  dialogoImport.value = true;
};

const iniciarImportacion = async () => {
  if (!importForm.value.archivo) {
    notificarError("Por favor selecciona un archivo CSV o JSON.");
    return;
  }
  if (!importForm.value.proveedorId) {
    notificarError("Por favor selecciona un proveedor.");
    return;
  }

  importando.value = true;
  try {
    const archivo = importForm.value.archivo;
    console.log("Archivo a importar (File):", { nombre: archivo?.name, tamaño: archivo?.size, tipo: archivo?.type });

    const formData = new FormData();
    formData.append("archivo", archivo);
    formData.append("proveedorId", importForm.value.proveedorId);

    const resp = await post("/imports", formData);

    const jobId = resp.importJobId || resp.id;
    importJob.value = {
      importJobId: jobId,
      estado: resp.estado || "pending",
      total: 0,
      procesados: 0,
      exitosos: 0,
      fallidos: 0,
      porcentaje: 0,
      errores: [],
    };

    notificarOk("Importación encolada. Procesando en segundo plano...");
    monitorearProgreso(jobId);
  } catch (e) {
    notificarError(e);
    importando.value = false;
  }
};

const monitorearProgreso = (jobId) => {
  if (intervaloProgreso) clearInterval(intervaloProgreso);

  intervaloProgreso = setInterval(async () => {
    try {
      const datos = await get(`/imports/${jobId}`);
      importJob.value = datos;

      if (datos.estado === "completed") {
        clearInterval(intervaloProgreso);
        intervaloProgreso = null;
        importando.value = false;
        dialogoImport.value = false;
        notificarOk(
          datos.message ||
            `Importación completada: ${datos.exitosos ?? 0} exitosos, ${datos.fallidos ?? 0} fallidos`
        );
        await cargar();
      } else if (datos.estado === "failed") {
        clearInterval(intervaloProgreso);
        intervaloProgreso = null;
        importando.value = false;
        notificarError(
          datos.motivoFallo
            ? `La importación falló: ${datos.motivoFallo}`
            : "La importación falló, no se pudo determinar el motivo"
        );
      }
    } catch (e) {
      clearInterval(intervaloProgreso);
      intervaloProgreso = null;
      importando.value = false;
    }
  }, 1500);
};

const cerrarDialogoImport = () => {
  if (intervaloProgreso) {
    clearInterval(intervaloProgreso);
    intervaloProgreso = null;
  }
  dialogoImport.value = false;
};

onBeforeUnmount(() => {
  if (intervaloProgreso) clearInterval(intervaloProgreso);
});
</script>

<template>
  <q-page>
    <div class="contenedor-app">
      <EncabezadoPagina titulo="Productos" subtitulo="Gestion del inventario del catalogo" icono="inventory_2">
        <template #acciones>
          <q-btn outline no-caps color="primary" icon="upload_file" label="Importar CSV" class="q-mr-sm"
            @click="abrirImportar" />
          <q-btn unelevated no-caps color="primary" icon="add" label="Nuevo producto" @click="abrirCreacion" />
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
              <span v-for="columna in columnas" :key="columna.name"
                class="esqueleto-col text-caption text-weight-bold text-grey-7">
                {{ columna.label }}
              </span>
            </div>

            <q-separator />

            <div v-for="fila in 5" :key="fila" class="esqueleto-fila q-px-md q-py-md">
              <q-skeleton v-for="(columna, indice) in columnas" :key="columna.name" type="text" animation="wave"
                class="esqueleto-col" :width="anchoEsqueleto(indice)" />
            </div>
          </q-card>
        </div>

        <TablaDatos v-else key="tabla" :filas="productos" :columnas="columnas" :cargando="cargando"
          mensaje-vacio="Aun no hay productos registrados" class="tabla-productos">
          <template #body-cell-disponible="celda">
            <q-td :props="celda" class="text-center">
              <q-badge class="insignia-disponible" :color="celda.row.disponible ? 'positive' : 'grey-6'"
                :label="celda.row.disponible ? 'Disponible' : 'Agotado'" />
            </q-td>
          </template>

          <template #body-cell-acciones="celda">
            <q-td :props="celda" class="text-right">
              <q-btn flat round size="md" icon="edit" color="primary" class="action-secondary q-mr-xs"
                @click="abrirEdicion(celda.row)">
                <q-tooltip>Editar</q-tooltip>
              </q-btn>

              <q-btn flat round size="md" icon="delete" color="negative" class="action-secondary"
                @click="eliminar(celda.row)">
                <q-tooltip>Eliminar</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </TablaDatos>
      </transition>
    </div>

    <q-dialog v-model="dialogo" persistent @show="formularioRef?.resetValidation()">
      <q-card class="dialog-card dialog-card--ancho modal-producto">
        <q-card-section class="cabecera-modal row items-center no-wrap">
          <div class="icono-cabecera">
            <q-icon :name="esEdicion ? 'edit' : 'add'" size="22px" />
          </div>

          <div class="q-ml-md">
            <div class="dialog-title">{{ esEdicion ? "Editar producto" : "Nuevo producto" }}</div>
            <div class="text-caption texto-cabecera">Inventario del catalogo</div>
          </div>

          <q-space />
          <q-btn v-close-popup flat round dense icon="close" color="white" class="boton-cerrar" />
        </q-card-section>

        <q-form ref="formularioRef" greedy @submit="guardar">
          <q-card-section class="cuerpo-modal q-gutter-y-lg">
            <div>
              <div class="etiqueta-grupo">Identificacion</div>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6">
                  <q-input v-model="formulario.sku" outlined label="SKU *" hint="Identificador unico del producto"
                    :rules="[requerido('El SKU'), minimo(2, 'El SKU')]" lazy-rules />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input v-model="formulario.nombre" outlined label="Nombre *"
                    :rules="[requerido('El nombre'), minimo(1, 'El nombre')]" lazy-rules />
                </div>
              </div>
            </div>

            <div>
              <div class="etiqueta-grupo">Precio e inventario</div>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6">
                  <q-input v-model.number="formulario.precio" outlined type="number" label="Precio *" step="0.01"
                    :rules="[requerido('El precio'), mayorIgualA(0, 'El precio')]" lazy-rules />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input v-model.number="formulario.stock" outlined type="number" label="Stock *"
                    :rules="[enteroMayorIgualA(0, 'El stock')]" lazy-rules />
                </div>
              </div>
            </div>

            <div>
              <div class="etiqueta-grupo">Clasificacion</div>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6">
                  <q-select v-model="formulario.categoria" outlined emit-value map-options use-input
                    new-value-mode="add-unique" label="Categoria *" :options="opcionesCategorias"
                    :rules="[seleccionRequerida('una categoria')]" lazy-rules
                    hint="Selecciona o escribe una nueva categoría">
                    <template #no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          Escribe el nombre de la categoría y presiona Enter
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
                <div class="col-12 col-sm-6">
                  <q-select v-model="formulario.proveedorId" outlined emit-value map-options label="Proveedor *"
                    :options="opcionesProveedores" :rules="[seleccionRequerida('un proveedor')]" lazy-rules>
                    <template #no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          No hay proveedores disponibles
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
              </div>
            </div>

            <div>
              <div class="etiqueta-grupo">Informacion adicional</div>
              <div class="q-gutter-y-md">
                <q-input v-model="formulario.descripcion" outlined type="textarea" label="Descripcion" hint="Opcional"
                  autogrow />

                <q-input v-model="formulario.imagenUrl" outlined label="URL de la imagen"
                  hint="Opcional. Ej: https://.../producto.jpg" :rules="[esUrl()]" lazy-rules />
              </div>
            </div>
          </q-card-section>

          <q-card-actions align="right" class="pie-modal">
            <q-btn v-close-popup flat no-caps label="Cancelar" color="dark" class="btn-cancel" />
            <q-btn unelevated no-caps type="submit" color="primary" class="btn-ok"
              :label="esEdicion ? 'Guardar cambios' : 'Registrar producto'" :loading="guardando" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- Modal de Importación Masiva (CSV / JSON) -->
    <q-dialog v-model="dialogoImport" persistent>
      <q-card class="dialog-card modal-producto" style="max-width: 540px; width: 100%;">
        <q-card-section class="cabecera-modal row items-center no-wrap">
          <div class="icono-cabecera">
            <q-icon name="upload_file" size="22px" />
          </div>

          <div class="q-ml-md">
            <div class="dialog-title">Carga masiva de productos</div>
            <div class="text-caption texto-cabecera">Importar catálogo vía CSV o JSON</div>
          </div>

          <q-space />
          <q-btn flat round dense icon="close" color="white" class="boton-cerrar" @click="cerrarDialogoImport" />
        </q-card-section>

        <q-card-section class="cuerpo-modal q-gutter-y-md">
          <!-- Formulario antes de iniciar -->
          <div v-if="!importJob">
            <div class="q-mb-md text-caption text-grey-8">
              Sube un archivo <strong>.csv</strong> con columnas:
              <code>sku,nombre,precio,stock,categoria,descripcion,imagenUrl</code>.
            </div>

            <div class="q-gutter-y-md">
              <q-select v-model="importForm.proveedorId" outlined emit-value map-options
                label="Proveedor para la importación *" :options="opcionesProveedores"
                :rules="[seleccionRequerida('un proveedor')]">
                <template #no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      Debes registrar al menos un proveedor primero
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>

              <q-file v-model="importForm.archivo" outlined label="Seleccionar archivo (.csv, .json) *"
                accept=".csv, .json" clearable>
                <template #prepend>
                  <q-icon name="attach_file" color="primary" />
                </template>
              </q-file>
            </div>
          </div>

          <!-- Monitor de Progreso en Vivo -->
          <div v-else class="q-gutter-y-md">
            <div class="row items-center justify-between">
              <div class="text-subtitle2 text-weight-bold">
                Estado:
                <q-badge
                  :color="importJob.estado === 'completed' ? 'positive' : importJob.estado === 'failed' ? 'negative' : 'warning'"
                  :label="importJob.estado" class="q-ml-xs text-uppercase" />
              </div>
              <div v-if="importJob.total > 0" class="text-caption text-grey-7">
                {{ importJob.procesados }} / {{ importJob.total }} filas
              </div>
            </div>

            <q-linear-progress
              :value="(importJob.porcentaje || (importJob.total ? importJob.procesados / importJob.total : 0)) / 100"
              size="16px" rounded color="primary" track-color="grey-3" stripe
              :indeterminate="importJob.estado === 'pending' || (importJob.estado === 'processing' && !importJob.total)">
              <div class="absolute-full flex flex-center">
                <q-badge color="white" text-color="primary" :label="`${importJob.porcentaje || 0}%`" />
              </div>
            </q-linear-progress>

            <div class="row q-col-gutter-sm text-center q-pt-sm">
              <div class="col-4">
                <q-card flat bordered class="q-pa-sm bg-grey-1">
                  <div class="text-caption text-grey-7">Procesados</div>
                  <div class="text-h6 text-weight-bold">{{ importJob.procesados || 0 }}</div>
                </q-card>
              </div>
              <div class="col-4">
                <q-card flat bordered class="q-pa-sm bg-green-1 text-positive">
                  <div class="text-caption">Exitosos</div>
                  <div class="text-h6 text-weight-bold">{{ importJob.exitosos || 0 }}</div>
                </q-card>
              </div>
              <div class="col-4">
                <q-card flat bordered class="q-pa-sm bg-red-1 text-negative">
                  <div class="text-caption">Fallidos</div>
                  <div class="text-h6 text-weight-bold">{{ importJob.fallidos || 0 }}</div>
                </q-card>
              </div>
            </div>

            <!-- Lista de errores si existen -->
            <div v-if="importJob.errores && importJob.errores.length > 0" class="q-mt-sm">
              <div class="text-caption text-weight-bold text-negative q-mb-xs">
                Detalle de errores ({{ importJob.errores.length }}):
              </div>
              <q-scroll-area style="height: 120px; border: 1px solid #ffcdd2; border-radius: 8px; padding: 6px;">
                <div v-for="(err, idx) in importJob.errores" :key="idx" class="text-caption text-grey-9 q-py-xs">
                  • <strong>Fila {{ err.fila }}</strong> <span v-if="err.sku">({{ err.sku }})</span>: {{ err.motivo }}
                </div>
              </q-scroll-area>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="pie-modal">
          <q-btn flat no-caps label="Cerrar" color="dark" class="btn-cancel" @click="cerrarDialogoImport" />
          <q-btn v-if="!importJob || (importJob.estado !== 'completed' && importJob.estado !== 'failed' && !importando)"
            unelevated no-caps color="primary" class="btn-ok" label="Comenzar importación" :loading="importando"
            :disable="!importForm.archivo || !importForm.proveedorId" @click="iniciarImportacion" />
          <q-btn v-else-if="importJob.estado === 'completed' || importJob.estado === 'failed'" unelevated no-caps
            color="primary" class="btn-ok" label="Listo" @click="cerrarDialogoImport" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style scoped lang="scss">
// La tabla vive dentro de TablaDatos (componente hijo), asi que ajustamos
// su spacing/tipografia desde afuera con :deep() en vez de tocar ese componente.
.tabla-productos {
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

.insignia-disponible {
  font-size: 0.78rem;
  padding: 6px 12px;
  border-radius: 8px;
}

.action-secondary {
  font-size: 1.15rem;
}

// ---- Modal de producto ---------------------------------------------------

.modal-producto {
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