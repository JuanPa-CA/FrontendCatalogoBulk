<script setup>

import { computed, onMounted, ref } from "vue";

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

    notificarOk(respuesta.msg || "Producto guardado");
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
    notificarOk(respuesta.msg || "Producto eliminado");
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
        titulo="Productos"
        subtitulo="Gestion del inventario del catalogo"
        icono="inventory_2"
      >
        <template #acciones>
          <q-btn
            unelevated no-caps color="primary" icon="add" label="Nuevo producto"
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
        :filas="productos"
        :columnas="columnas"
        :cargando="cargando"
        mensaje-vacio="Aun no hay productos registrados"
      >
        <template #body-cell-disponible="celda">
          <q-td :props="celda" class="text-center">
            <q-badge
              :color="celda.row.disponible ? 'positive' : 'grey-6'"
              :label="celda.row.disponible ? 'Disponible' : 'Agotado'"
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
      <q-card class="dialog-card dialog-card--ancho">
        <q-card-section class="bg-primary text-white row items-center no-wrap q-px-lg q-py-md">
          <q-icon :name="esEdicion ? 'edit' : 'add'" size="28px" class="q-mr-md" />

          <div>
            <div class="dialog-title">{{ esEdicion ? "Editar producto" : "Nuevo producto" }}</div>
            <div class="text-caption text-green-2">Inventario del catalogo</div>
          </div>

          <q-space />
          <q-btn v-close-popup flat round dense icon="close" color="white" />
        </q-card-section>

        <q-form ref="formularioRef" greedy @submit="guardar">
          <q-card-section class="q-gutter-md">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="formulario.sku"
                  outlined dense label="SKU *"
                  hint="Identificador unico del producto"
                  :rules="[requerido('El SKU'), minimo(2, 'El SKU')]"
                  lazy-rules
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="formulario.nombre"
                  outlined dense label="Nombre *"
                  :rules="[requerido('El nombre'), minimo(1, 'El nombre')]"
                  lazy-rules
                />
              </div>
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model.number="formulario.precio"
                  outlined dense type="number" label="Precio *" step="0.01"
                  :rules="[requerido('El precio'), mayorIgualA(0, 'El precio')]"
                  lazy-rules
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model.number="formulario.stock"
                  outlined dense type="number" label="Stock *"
                  :rules="[enteroMayorIgualA(0, 'El stock')]"
                  lazy-rules
                />
              </div>
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-select
                  v-model="formulario.categoria"
                  outlined dense emit-value map-options label="Categoria *"
                  :options="opcionesCategorias"
                  :rules="[seleccionRequerida('una categoria')]"
                  lazy-rules
                >
                  <template #no-option>
                    <q-item>
                      <q-item-section class="text-grey">
                        No hay categorias disponibles
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
              <div class="col-12 col-sm-6">
                <q-select
                  v-model="formulario.proveedorId"
                  outlined dense emit-value map-options label="Proveedor *"
                  :options="opcionesProveedores"
                  :rules="[seleccionRequerida('un proveedor')]"
                  lazy-rules
                >
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

            <q-input
              v-model="formulario.descripcion"
              outlined dense type="textarea" label="Descripcion"
              hint="Opcional"
              autogrow
            />

            <q-input
              v-model="formulario.imagenUrl"
              outlined dense label="URL de la imagen"
              hint="Opcional. Ej: https://.../producto.jpg"
              :rules="[esUrl()]"
              lazy-rules
            />
          </q-card-section>

          <q-card-actions align="right" class="q-px-md q-pb-md">
            <q-btn v-close-popup flat no-caps label="Cancelar" color="dark" class="btn-cancel" />
            <q-btn
              unelevated no-caps type="submit" color="primary" class="btn-ok"
              :label="esEdicion ? 'Guardar cambios' : 'Registrar producto'"
              :loading="guardando"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>
