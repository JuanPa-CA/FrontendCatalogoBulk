<script setup>
/**
 * /views/UsuariosView.vue
 * CRUD de usuarios (solo admin). Campos: email, password (hash bcrypt, nunca se
 * devuelve), rol ("admin" | "user") y activo (para PUT /:id/status).
 *
 * Endpoints:
 *   GET    /usuarios            listar
 *   GET    /usuarios/:id        obtener uno
 *   POST   /usuarios            crear
 *   PUT    /usuarios/:id        editar
 *   PUT    /usuarios/:id/status cambiar estado (activo)
 */
import { computed, onMounted, ref } from "vue";

import EncabezadoPagina from "@/components/Encabezados/EncabezadoPagina.vue";
import TablaDatos from "@/components/Tables/TablaDatos.vue";

import { get, post, put } from "@/services/api.service";
import { extraerLista } from "@/utils/normalizar";
import { useGeneralStore } from "@/store/General";
import { useNotificar } from "@/composables/useNotificar";
import { useConfirmar } from "@/composables/useConfirmar";
import { requerido, esEmail, minimo } from "@/utils/reglas";

const general = useGeneralStore();
const { notificarOk, notificarError } = useNotificar();
const { confirmar } = useConfirmar();

const columnas = [
  { name: "email", label: "Email", field: "email", align: "left", sortable: true },
  { name: "rol", label: "Rol", field: "rol", align: "center", sortable: true },
  { name: "activo", label: "Estado", field: "activo", align: "center", sortable: true },
  { name: "acciones", label: "Acciones", field: "acciones", align: "right" },
];

const opcionesRol = [
  { label: "Administrador", value: "admin" },
  { label: "Usuario", value: "user" },
];

const usuarios = ref([]);
const cargando = ref(false);
const error = ref(null);

const cargar = async () => {
  cargando.value = true;
  error.value = null;

  try {
    const respuesta = await get("/usuarios");
    usuarios.value = extraerLista(respuesta);
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
const usuarioEditando = ref(null);
const formularioRef = ref(null);

const formulario = ref({ email: "", password: "", rol: "user" });

const esEdicion = computed(() => usuarioEditando.value !== null);

const formularioVacio = () => ({ email: "", password: "", rol: "user" });

const abrirCreacion = () => {
  usuarioEditando.value = null;
  formulario.value = formularioVacio();
  dialogo.value = true;
};

const abrirEdicion = (usuario) => {
  usuarioEditando.value = usuario;
  formulario.value = {
    email: usuario.email,
    password: "",
    rol: usuario.rol,
  };
  dialogo.value = true;
};

/**
 * En edicion el password es opcional: si queda vacio no se cambia. En creacion
 * si es obligatorio. Por eso se arma la lista de reglas segun el caso.
 */
const reglasPassword = computed(() => {
  if (esEdicion.value) {
    return [(v) => !v || String(v).length >= 6 || "Debe tener al menos 6 caracteres"];
  }
  return [requerido("La contraseña"), minimo(6, "La contraseña")];
});

const guardar = async () => {
  guardando.value = true;

  try {
    const datos = {
      email: formulario.value.email.trim(),
      rol: formulario.value.rol,
    };

    // En edicion el password solo se envia si el usuario escribio uno nuevo.
    if (formulario.value.password) {
      datos.password = formulario.value.password;
    }

    const respuesta = esEdicion.value
      ? await put(`/usuarios/${usuarioEditando.value._id}`, datos)
      : await post("/usuarios", { ...datos, password: formulario.value.password });

    notificarOk(respuesta.msg || "Usuario guardado");
    dialogo.value = false;
    await cargar();
  } catch (e) {
    notificarError(e);
  } finally {
    guardando.value = false;
  }
};

// --- Cambiar estado ------------------------------------------------------
const cambiarEstado = async (usuario) => {
  const activo = usuario.activo !== false;

  const aceptado = await confirmar({
    titulo: activo ? "Desactivar usuario" : "Activar usuario",
    mensaje: `¿Confirmas ${activo ? "desactivar" : "activar"} a ${usuario.email}?`,
    textoOk: activo ? "Desactivar" : "Activar",
    color: activo ? "negative" : "primary",
  });

  if (!aceptado) return;

  try {
    const respuesta = await put(`/usuarios/${usuario._id}/status`, { activo: !activo });
    notificarOk(respuesta.msg || "Estado actualizado");
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
        titulo="Usuarios"
        subtitulo="Cuentas de acceso a la aplicacion"
        icono="manage_accounts"
      >
        <template #acciones>
          <q-btn
            unelevated no-caps color="primary" icon="person_add" label="Nuevo usuario"
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
        :filas="usuarios"
        :columnas="columnas"
        :cargando="cargando"
        mensaje-vacio="Aun no hay usuarios registrados"
      >
        <template #body-cell-rol="celda">
          <q-td :props="celda" class="text-center">
            <q-badge
              :color="celda.row.rol === 'admin' ? 'primary' : 'grey-7'"
              :label="celda.row.rol === 'admin' ? 'Admin' : 'Usuario'"
            />
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
          </q-td>
        </template>
      </TablaDatos>
    </div>

    <q-dialog v-model="dialogo" persistent @show="formularioRef?.resetValidation()">
      <q-card class="dialog-card">
        <q-card-section class="bg-primary text-white row items-center no-wrap q-px-lg q-py-md">
          <q-icon :name="esEdicion ? 'edit' : 'add'" size="28px" class="q-mr-md" />

          <div>
            <div class="dialog-title">{{ esEdicion ? "Editar usuario" : "Nuevo usuario" }}</div>
            <div class="text-caption text-green-2">Cuentas de acceso</div>
          </div>

          <q-space />
          <q-btn v-close-popup flat round dense icon="close" color="white" />
        </q-card-section>

        <q-form ref="formularioRef" greedy @submit="guardar">
          <q-card-section class="q-gutter-md">
            <q-input
              v-model="formulario.email"
              outlined dense type="email" label="Email *"
              :rules="[requerido('El email'), esEmail()]"
              lazy-rules
            >
              <template #prepend>
                <q-icon name="mail" />
              </template>
            </q-input>

            <q-input
              v-model="formulario.password"
              outlined dense
              :label="esEdicion ? 'Contraseña (dejar vacia para no cambiar)' : 'Contraseña *'"
              :type="'password'"
              autocomplete="new-password"
              :rules="reglasPassword"
              lazy-rules
            >
              <template #prepend>
                <q-icon name="lock" />
              </template>
            </q-input>

            <q-select
              v-model="formulario.rol"
              outlined dense emit-value map-options label="Rol *"
              :options="opcionesRol"
            />
          </q-card-section>

          <q-card-actions align="right" class="q-px-md q-pb-md">
            <q-btn v-close-popup flat no-caps label="Cancelar" color="dark" class="btn-cancel" />
            <q-btn
              unelevated no-caps type="submit" color="primary" class="btn-ok"
              :label="esEdicion ? 'Guardar cambios' : 'Crear usuario'"
              :loading="guardando"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>
