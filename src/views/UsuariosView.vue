<script setup>

import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

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

// Esqueleto de carga: solo aparece si tarda mas de 300ms, para no
// generar parpadeo en cargas rapidas.
const mostrarEsqueleto = ref(false);
const anchosEsqueleto = ["75%", "45%", "45%", "60%"];
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

  
    if (formulario.value.password) {
      datos.password = formulario.value.password;
    }

    const respuesta = esEdicion.value
      ? await put(`/usuarios/${usuarioEditando.value._id}`, datos)
      : await post("/usuarios", { ...datos, password: formulario.value.password });

    notificarOk(respuesta.message || "Usuario guardado");
    dialogo.value = false;
    await cargar();
  } catch (e) {
    notificarError(e);
  } finally {
    guardando.value = false;
  }
};


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
    notificarOk(respuesta.message || "Estado actualizado");
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
          :filas="usuarios"
          :columnas="columnas"
          :cargando="cargando"
          mensaje-vacio="Aun no hay usuarios registrados"
          class="tabla-usuarios"
        >
          <template #body-cell-rol="celda">
            <q-td :props="celda" class="text-center">
              <q-badge
                class="insignia-rol"
                :color="celda.row.rol === 'admin' ? 'primary' : 'grey-7'"
                :label="celda.row.rol === 'admin' ? 'Admin' : 'Usuario'"
              />
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
                flat round size="md" class="action-secondary"
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
      </transition>
    </div>

    <q-dialog v-model="dialogo" persistent @show="formularioRef?.resetValidation()">
      <q-card class="dialog-card modal-usuario">
        <q-card-section class="cabecera-modal row items-center no-wrap">
          <div class="icono-cabecera">
            <q-icon :name="esEdicion ? 'edit' : 'add'" size="22px" />
          </div>

          <div class="q-ml-md">
            <div class="dialog-title">{{ esEdicion ? "Editar usuario" : "Nuevo usuario" }}</div>
            <div class="text-caption texto-cabecera">Cuentas de acceso</div>
          </div>

          <q-space />
          <q-btn v-close-popup flat round dense icon="close" color="white" class="boton-cerrar" />
        </q-card-section>

        <q-form ref="formularioRef" greedy @submit="guardar">
          <q-card-section class="cuerpo-modal q-gutter-y-lg">
            <div>
              <div class="etiqueta-grupo">Credenciales</div>
              <div class="q-gutter-y-md">
                <q-input
                  v-model="formulario.email"
                  outlined type="email" label="Email *"
                  :rules="[requerido('El email'), esEmail()]"
                  lazy-rules
                >
                  <template #prepend>
                    <q-icon name="mail" color="primary" />
                  </template>
                </q-input>

                <q-input
                  v-model="formulario.password"
                  outlined
                  :label="esEdicion ? 'Contraseña (dejar vacia para no cambiar)' : 'Contraseña *'"
                  :type="'password'"
                  autocomplete="new-password"
                  :rules="reglasPassword"
                  lazy-rules
                >
                  <template #prepend>
                    <q-icon name="lock" color="primary" />
                  </template>
                </q-input>
              </div>
            </div>

            <div>
              <div class="etiqueta-grupo">Permisos</div>
              <q-select
                v-model="formulario.rol"
                outlined emit-value map-options label="Rol *"
                :options="opcionesRol"
              />
            </div>
          </q-card-section>

          <q-card-actions align="right" class="pie-modal">
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

<style scoped lang="scss">
// La tabla vive dentro de TablaDatos (componente hijo), asi que ajustamos
// su spacing/tipografia desde afuera con :deep() en vez de tocar ese componente.
.tabla-usuarios {
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

.insignia-rol,
.insignia-estado {
  font-size: 0.78rem;
  padding: 6px 12px;
  border-radius: 8px;
}

.action-secondary {
  font-size: 1.15rem;
}

// ---- Modal de usuario ---------------------------------------------------

.modal-usuario {
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