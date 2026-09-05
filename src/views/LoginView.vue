<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

import { post } from "@/services/api.service";
import { useAuthStore } from "@/store/Auth";
import { useGeneralStore } from "@/store/General";
import { useNotificar } from "@/composables/useNotificar";
import { requerido, esEmail, minimo } from "@/utils/reglas";
import logo from "@/assets/cubo.png";

const router = useRouter();
const auth = useAuthStore();
const general = useGeneralStore();
const { notificarOk, notificarError } = useNotificar();

const formulario = ref({ email: "", password: "" });
const verPassword = ref(false);
const enviando = ref(false);

const iniciarSesion = async () => {
  enviando.value = true;

  try {
    const respuesta = await post("/auth/login", {
      email: formulario.value.email.trim(),
      password: formulario.value.password,
    });

    auth.guardarSesion(respuesta.token);

    notificarOk("Bienvenido");
    // El admin entra a productos; el usuario normal, al catalogo.
    router.push({ name: auth.esAdmin ? "productos" : "catalogo" });
  } catch (e) {
    notificarError(e);
  } finally {
    enviando.value = false;
  }
};
</script>

<template>
  <div class="pantalla-login window-height flex flex-center q-pa-md relative-position overflow-hidden bg-white">
    <!-- Decoracion: puntos -->
    <div class="patron-puntos absolute-top-left"></div>

    <!-- Decoracion: blobs -->
    <div class="blob blob--uno bg-primary"></div>
    <div class="blob blob--dos bg-primary"></div>
    <q-icon name="widgets" class="blob-icono absolute" size="140px" />

    <!-- Decoracion: franja diagonal -->
    <div class="franja-diagonal bg-primary"></div>

    <div class="columna-login relative-position">
      <q-card flat bordered class="tarjeta bg-white rounded-borders-lg shadow-10">
        <q-card-section class="text-center q-pt-xl q-pb-none">
          <div class="marco-logo q-mx-auto shadow-6">
            <img :src="logo" alt="Logo" class="imagen-logo" />
          </div>

          <div class="text-h6 text-weight-bold text-dark q-mt-md">
            {{ general.titulo }}
          </div>
          <p class="text-body2 text-grey-7 q-mb-none">
            Inicia sesion para acceder.
          </p>
        </q-card-section>

        <q-form greedy @submit="iniciarSesion">
          <q-card-section class="q-gutter-md q-pt-lg">
            <q-input
              v-model="formulario.email"
              outlined
              color="primary"
              type="email"
              label="Email *"
              autocomplete="email"
              autofocus
              :rules="[requerido('El email'), esEmail()]"
              lazy-rules
            >
              <template #prepend>
                <q-icon name="mail" color="primary" size="20px" />
              </template>
            </q-input>

            <q-input
              v-model="formulario.password"
              outlined
              color="primary"
              label="Contraseña *"
              autocomplete="current-password"
              :type="verPassword ? 'text' : 'password'"
              :rules="[requerido('La contraseña'), minimo(6, 'La contraseña')]"
              lazy-rules
            >
              <template #prepend>
                <q-icon name="lock" color="primary" size="20px" />
              </template>
              <template #append>
                <q-icon
                  :name="verPassword ? 'visibility_off' : 'visibility'"
                  color="grey-7"
                  class="cursor-pointer"
                  @click="verPassword = !verPassword"
                />
              </template>
            </q-input>
          </q-card-section>

          <q-card-actions class="q-px-md q-pb-md q-pt-sm column">
            <q-btn
              unelevated
              no-caps
              type="submit"
              color="primary"
              size="lg"
              class="full-width rounded-borders-lg boton-entrar"
              label="Entrar"
              :loading="enviando"
            />

            <q-btn
              flat
              no-caps
              icon="arrow_back"
              label="Volver al catalogo"
              color="primary"
              class="full-width q-mt-sm rounded-borders-lg"
              :to="{ name: 'catalogo' }"
            />
          </q-card-actions>
        </q-form>
      </q-card>

      <p class="text-center text-caption text-grey-6 q-mt-md q-mb-none">
        <q-icon name="dns" size="14px" class="q-mr-xs" />{{ general.urlApi }}
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.pantalla-login {
  isolation: isolate;
}

// ---- Decoraciones ----------------------------------------------------

.patron-puntos {
  width: 260px;
  height: 260px;
  background-image: radial-gradient(var(--q-primary) 1.5px, transparent 1.5px);
  background-size: 18px 18px;
  opacity: 0.12;
  z-index: 0;
}

.blob {
  position: absolute;
  border-radius: 42% 58% 65% 35% / 45% 40% 60% 55%;
  filter: blur(2px);
  z-index: 0;

  &--uno {
    width: 340px;
    height: 340px;
    top: -120px;
    right: -140px;
    opacity: 0.14;
    animation: flotar 9s ease-in-out infinite;
  }

  &--dos {
    width: 220px;
    height: 220px;
    bottom: -90px;
    left: -90px;
    opacity: 0.1;
    animation: flotar 11s ease-in-out infinite reverse;
  }
}

.blob-icono {
  bottom: 40px;
  right: 40px;
  color: var(--q-primary);
  opacity: 0.08;
  transform: rotate(-12deg);
  z-index: 0;
}

.franja-diagonal {
  position: absolute;
  width: 160%;
  height: 90px;
  top: 22%;
  left: -30%;
  opacity: 0.05;
  transform: rotate(-6deg);
  z-index: 0;
}

@keyframes flotar {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(16px) scale(1.05);
  }
}

@media (prefers-reduced-motion: reduce) {
  .blob {
    animation: none;
  }
}

// ---- Tarjeta -----------------------------------------------------------

.columna-login {
  width: 400px;
  max-width: 92vw;
  z-index: 1;
  animation: aparecer 0.45s ease-out;
}

@keyframes aparecer {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.rounded-borders-lg {
  border-radius: 16px;
}

.marco-logo {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  border: 3px solid white;
  outline: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.imagen-logo {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.boton-entrar {
  font-weight: 600;
  letter-spacing: 0.2px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-1px);
  }
}
</style>