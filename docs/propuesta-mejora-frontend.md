# Propuesta Tecnica: Mejora del Frontend de Foodsynk

> **Fecha:** 2026-03-24 (rev. 2)
> **Alcance:** Coherencia visual, vista publica, zona de usuario, rehidratacion de sesion
> **Stack:** React 19 + Vite 7 + Tailwind CSS 3.4 + React Router 7
> **Estado:** Pendiente de aprobacion

---

## 1. Entendimiento del proyecto

### 1.1 Estado actual del frontend

Foodsynk es una aplicacion de gestion de recetas con un frontend construido en **React 19**, empaquetado con **Vite 7** y estilado con **Tailwind CSS 3.4** (utility-first). La comunicacion con el backend (Laravel + Sanctum) se realiza mediante **Axios** con interceptores que adjuntan automaticamente el token Bearer.

**Estructura actual:**

```
src/
  api/axios.js              → Cliente HTTP configurado
  auth/
    AuthContext.jsx          → Context de autenticacion
    AuthProvider.jsx         → Proveedor (token en sessionStorage, user solo en memoria)
    ProtectedRoute.jsx       → Guarda de rutas (redirige a "/" si no hay token)
    useAuth.js               → Hook de acceso al contexto
  components/
    ConfirmModal.jsx         → Modal de confirmacion (eliminacion)
    EmptyState.jsx           → Estado vacio reutilizable
    ErrorMessage.jsx         → Mensaje de error reutilizable
    LoadingSpinner.jsx       → Spinner de carga
    Navbar.jsx               → Barra superior + sidebar lateral (solo contexto autenticado)
    PageHeader.jsx           → Titulo + subtitulo de pagina
    RecipeCard.jsx           → Tarjeta individual de receta
    RecipeGrid.jsx           → Grid responsivo de tarjetas
  layouts/
    ProtectedLayout.jsx      → Shell para paginas protegidas (Navbar + Outlet)
  pages/
    Login.jsx                → Inicio de sesion
    Register.jsx             → Registro de usuario
    Home.jsx                 → Listado de todas las recetas
    MyRecipes.jsx            → Recetas del usuario (CRUD)
    RecipeDetail.jsx         → Detalle completo de receta
    EditRecipe.jsx           → Formulario de edicion de receta
```

**Rutas definidas en `main.jsx`:**

| Ruta | Componente | Acceso |
|------|-----------|--------|
| `/` | `Login` | Publica (entry point) |
| `/register` | `Register` | Publica |
| `/home` | `Home` | Protegida |
| `/my-recipes` | `MyRecipes` | Protegida |
| `/my-recipes/:id/edit` | `EditRecipe` | Protegida |
| `/recipes/:id` | `RecipeDetail` | Protegida |

**Sistema de autenticacion:**
- Token JWT almacenado en `sessionStorage`
- Interceptor de Axios lo adjunta a cada peticion
- `ProtectedRoute` redirige a `/` (Login) si no hay token
- `AuthProvider` gestiona estado de token y usuario via Context API

**Defecto critico detectado en la autenticacion:**
`AuthProvider.jsx` rehidrata el token desde sessionStorage al montar (linea 10-12), pero **no rehidrata el objeto `user`**. Tras un refresh del navegador, `token` existe pero `user` es `null`. Esto significa que cualquier componente que dependa de `user.name` (como un futuro badge de usuario) fallaria silenciosamente. Este defecto es preexistente y debe corregirse antes de construir funcionalidad que dependa del usuario.

**Paleta de colores de marca (definida en `tailwind.config.cjs`):**
- `brand-coral` (#E84C3D): Acciones destructivas, acento del logo
- `brand-green` (#2D6A4F): CTA primario, estados activos
- `brand-green-light` (#A7D7C5): Fondos suaves, bordes
- `brand-green-dark` (#1B4332): Estados hover
- `brand-orange` (#E8713A): Glows decorativos
- `brand-navy` (#1B2A4A): Texto principal, sidebar
- `brand-cream` (#F8F6F3): Fondo de aplicacion

### 1.2 Diferencias entre usuario registrado y no registrado

**Estado actual del frontend:**

| Capacidad | No registrado | Registrado |
|-----------|:---:|:---:|
| Ver la aplicacion | Solo Login/Register | Todo |
| Ver listado de recetas | NO | SI |
| Ver detalle de receta | NO | SI |
| Crear recetas | NO | SI |
| Editar recetas propias | NO | SI |
| Eliminar recetas propias | NO | SI |
| Ver "Mis Recetas" | NO | SI |

**Estado actual del backend** (segun `logs_back.md`, fix del 23/03/2026):

| Endpoint | Acceso backend |
|----------|:---:|
| `GET /api/recipes` | Publico (sin auth) |
| `GET /api/recipes/{id}` | Publico (sin auth) |
| `POST /api/recipes/search` | Publico (sin auth) |
| `POST /api/recipes` | Autenticado |
| `PUT /api/recipes/{id}` | Propietario |
| `DELETE /api/recipes/{id}` | Propietario |
| `GET /api/my-recipes` | Autenticado |

**Conclusion critica:** El backend ya soporta lectura publica de recetas (desde el fix del 23/03), pero el frontend aun obliga a autenticarse para ver cualquier receta. Hay una **desalineacion directa** entre lo que el backend permite y lo que el frontend expone.

### 1.3 Decisiones relevantes detectadas

1. **Arquitectura de componentes bien separada:** Componentes reutilizables (RecipeCard, RecipeGrid, PageHeader, etc.) estan correctamente aislados y reciben datos via props. Buena base para escalar.

2. **Sistema de colores centralizado:** El `tailwind.config.cjs` define una paleta de marca coherente que se usa en toda la app protegida (Login, Navbar, Home, MyRecipes, EditRecipe, RecipeDetail, etc.).

3. **Excepcion: Register.jsx usa colores hardcoded.** Usa una paleta "warm" completamente independiente (`#5f7d5f`, `#4d3b2f`, `#f6f2ea`, `#d7ccb8`, etc.) que no pasa por los tokens de marca. Esto fue identificado como deuda de diseno en `design-tokens.json`.

4. **Interceptor de Axios siempre activo:** El interceptor adjunta el token si existe en sessionStorage. Esto permite hacer peticiones publicas sin problemas (si no hay token, simplemente no se envia el header). No necesita cambios para soportar acceso anonimo.

5. **ProtectedLayout como unico shell de app:** Toda la experiencia post-login (Navbar + contenido) vive dentro de `ProtectedLayout`. Las paginas publicas (Login, Register) no tienen ningun layout compartido, ni navbar, ni estructura visual de aplicacion.

6. **RecipeCard navega siempre a `/recipes/{id}`:** La navegacion al detalle esta hardcodeada en el componente. Esto es reutilizable, pero el destino (`/recipes/:id`) esta actualmente dentro de rutas protegidas.

7. **El usuario no esta identificado visualmente en ninguna parte de la UI.** El Navbar no muestra nombre, email ni iniciales del usuario. Solo ofrece navegacion (Home, Mis Recetas) y logout.

8. **`navigate(-1)` en RecipeDetail no es robusto.** Si el usuario llega directamente a `/recipes/:id` (enlace externo, bookmark, URL compartida), `navigate(-1)` puede sacar al usuario de la aplicacion o no hacer nada. Esto es especialmente problematico si la ruta pasa a ser publica y compartible.

---

## 2. Problemas detectados / Oportunidades de mejora

### 2.1 UX

| # | Problema | Impacto |
|---|---------|---------|
| 1 | **Un usuario nuevo llega a Login, no a contenido.** La primera impresion es un formulario, no el producto. No hay forma de "probar antes de registrarse". | Alto |
| 2 | **No hay acceso publico a recetas.** A pesar de que el backend lo permite desde el 23/03, el frontend obliga a autenticarse para ver cualquier receta. | Alto |
| 3 | **El usuario logueado no tiene identidad visual.** No se ve nombre ni nick en el Navbar. No hay zona de usuario. | Medio |
| 4 | **Logout es el elemento mas prominente del header.** El boton de logout tiene color coral y esta en la posicion principal del header. No hay equilibrio con la identidad del usuario. | Bajo |
| 5 | **No hay return-to tras login.** Si un usuario intenta acceder a `/my-recipes` sin sesion, se le redirige a login. Tras autenticarse, siempre va a `/home`, no a donde intentaba ir. | Bajo |

### 2.2 Consistencia visual

| # | Problema | Detalle |
|---|---------|---------|
| 1 | **Register usa paleta completamente diferente al Login.** Login usa tokens de marca (`brand-green`, `brand-navy`, `brand-cream`). Register usa colores hardcoded (`#5f7d5f`, `#f6f2ea`, `#3f2f24`, etc.). |
| 2 | **Background:** Login = `bg-brand-cream` (#F8F6F3). Register = `bg-[#f6f2ea]` (tono mas calido/amarillento). |
| 3 | **Textos:** Login usa `text-brand-navy` (#1B2A4A). Register usa `text-[#3f2f24]` (marron oscuro). |
| 4 | **Inputs:** Login = `border-gray-200 bg-brand-cream/50 focus:border-brand-green`. Register = `border-[#d8cbb6] bg-white/70 focus:border-[#5f7d5f]`. |
| 5 | **Boton primario:** Login = `bg-brand-green hover:bg-brand-green-dark`. Register = `bg-[#5f7d5f] hover:bg-[#537153]`. |
| 6 | **Errores:** Login = `text-brand-coral border-red-200 bg-red-50`. Register = `text-[#8b3b2f] border-[#e7c7b7] bg-[#fff0e8]`. |
| 7 | **Panel info:** Login usa gradiente con tokens de marca. Register usa gradiente hardcoded `from-[#e6efe1] via-[#f1ebe0] to-[#d9ece7]`. |
| 8 | **Sombra del panel:** Login = `shadow-xl` (estandar). Register = `shadow-[0_20px_60px_-40px_rgba(63,47,36,0.7)]` (custom, mas dramatica). |

### 2.3 Arquitectura de componentes

| # | Oportunidad | Detalle |
|---|------------|---------|
| 1 | **No existe un layout para paginas publicas con shell visual.** No hay equivalente a `ProtectedLayout` para paginas accesibles sin login. |
| 2 | **Navbar esta acoplado a usuario autenticado.** Asume siempre que hay sesion activa (llama logout, no muestra opciones de login/register). No recibe su estado por props, lo consulta internamente. |
| 3 | **Home.jsx es reutilizable con minimos cambios.** Ya usa componentes genericos (RecipeGrid, PageHeader, etc.) y no depende de datos del usuario. La logica de fetch es candidata a extraerse como hook compartido. |
| 4 | **RecipeDetail.jsx no depende del usuario.** No muestra botones de edicion/eliminacion. Es candidato natural para acceso publico sin cambios logicos (salvo el `navigate(-1)`). |
| 5 | **No hay componente de zona de usuario.** No existe ninguna representacion visual del usuario logueado en la interfaz. |
| 6 | **`user` no sobrevive al refresh.** AuthProvider rehidrata `token` pero no `user`. Cualquier componente que consuma `user.name` falla tras F5. |

---

## 3. Plan de trabajo

Tareas ordenadas por dependencia y prioridad:

| Orden | Tarea | Prioridad |
|:---:|-------|:---------:|
| 0 | Rehidratar `user` en AuthProvider (persistir en sessionStorage) | **Critica** |
| 1 | Alinear Register.jsx con la paleta de marca del Login | Alta |
| 2 | Extraer hook `useRecipes()` para evitar duplicacion de logica de fetch | Alta |
| 3 | Renombrar ProtectedLayout a AppLayout (layout unico para toda la app) | Alta |
| 4 | Adaptar Navbar para funcionar por props (publico/autenticado) | Alta |
| 5 | Crear pagina publica de recetas (`Explore.jsx`) | Alta |
| 6 | Mover RecipeDetail a ruta publica + fix `navigate(-1)` | Alta |
| 7 | Reestructurar rutas en `main.jsx` + actualizar enlaces internos | Alta |
| 8 | Crear componente `UserBadge` + integrar en Navbar | Media |
| 9 | *(Opcional)* Return-to tras login via `location.state` | Baja |

---

## 4. Propuesta tecnica detallada

### 4.0 Tarea 0: Rehidratar user en AuthProvider (PREREQUERIMIENTO)

**Que se va a hacer:**
Persistir el objeto `user` en `sessionStorage` junto al token, y restaurarlo al montar el componente.

**Por que se hace asi:**
`AuthProvider.jsx` actualmente solo rehidrata el token:
```jsx
// Linea 10-12 de AuthProvider.jsx
useEffect(() => {
  const savedToken = sessionStorage.getItem("token");
  if (savedToken) setToken(savedToken);
}, []);
// user arranca en null y NUNCA se restaura tras refresh
```

Tras un F5, el usuario tiene sesion activa (`token` existe, pasa `ProtectedRoute`) pero `user` es `null`. Cualquier componente que lea `user.name` mostrara undefined o crasheara. Este defecto es **preexistente** pero se convierte en bloqueante al proponer `UserBadge`.

**Archivos afectados:**
- `src/auth/AuthProvider.jsx`

**Que hay actualmente:**
- `token` se guarda/restaura de `sessionStorage` correctamente
- `user` solo se establece en el flujo de login/register (`setUser(res.data.user)`) y vive unicamente en memoria

**Que se propone:**
Anadir persistencia de `user` en sessionStorage, simetrica a como se hace con `token`:

1. Al recibir un nuevo `user` (via `setUser`), guardarlo en sessionStorage como JSON
2. Al montar el componente, restaurar `user` desde sessionStorage
3. Al hacer logout (`setUser(null)`), limpiar `user` de sessionStorage

**Enfoque conceptual:**
```
AuthProvider
  mount → leer token de sessionStorage
        → leer user de sessionStorage (JSON.parse)
  setToken → guardar/borrar en sessionStorage (ya existe)
  setUser  → guardar/borrar en sessionStorage (NUEVO)
```

**Alternativa evaluada y descartada para el MVP:**
Llamar a `GET /api/user` o `/api/me` al detectar token guardado para rehidratar con datos frescos del servidor. Ventaja: datos siempre actualizados. Desventaja: requiere confirmar que el endpoint existe en el backend, anade una peticion bloqueante al arranque, y aumenta el acoplamiento. Queda como mejora posterior.

**Riesgo aceptado:**
Con la Opcion A (sessionStorage), el nombre del usuario podria estar desactualizado si se cambio desde otro dispositivo. Para un MVP con sesiones en sessionStorage (que ya se pierden al cerrar el navegador), esto es aceptable.

**Como se integra:**
Es un cambio aislado en `AuthProvider.jsx`. No afecta a ningun otro archivo. Debe implementarse **antes** que la Tarea 8 (UserBadge).

---

### 4.1 Tarea 1: Alinear Register.jsx con la paleta de marca

**Que se va a hacer:**
Reemplazar todos los colores hardcoded en `Register.jsx` por los tokens de marca definidos en `tailwind.config.cjs`, igualando la estructura visual del Login.

**Por que se hace asi:**
El Login ya esta correctamente alineado con la paleta de marca. Register fue creado con una paleta "warm" independiente que genera una desconexion visual evidente entre las dos paginas. Al unificar, se consigue que el flujo Login <-> Register sea percibido como parte de la misma aplicacion.

**Archivos afectados:**
- `src/pages/Register.jsx`

**Que hay actualmente:**
Register.jsx contiene ~20 colores hardcoded en formato hex (`#5f7d5f`, `#4d3b2f`, `#f6f2ea`, `#d7ccb8`, `#8b5a44`, etc.) que crean una paleta "warm" completamente separada de los tokens de marca.

**Que se propone:**
Mapa de reemplazos directo (sin cambiar estructura HTML ni logica):

| Elemento | Actual (Register) | Propuesto (marca) |
|----------|-------------------|-------------------|
| Fondo pagina | `bg-[#f6f2ea]` | `bg-brand-cream` |
| Texto principal | `text-[#3f2f24]` | `text-brand-navy` |
| Eyebrow "Foodsynk" | `text-[#5f7d5f]` | `text-brand-green` |
| Titulo h1 | `text-[#2f4a2f]` | `text-brand-navy` |
| Subtitulo | `text-[#6b5a4b]` | `text-gray-500` |
| Labels | `text-[#4d3b2f]` | `text-brand-navy` |
| Borde inputs | `border-[#d8cbb6]` | `border-gray-200` |
| Fondo inputs | `bg-white/70` | `bg-brand-cream/50` |
| Texto inputs | `text-[#3f2f24]` | `text-brand-navy` |
| Placeholder | `text-[#9a8a7a]` | `text-gray-400` |
| Focus borde | `focus:border-[#5f7d5f]` | `focus:border-brand-green` |
| Focus ring | `focus:ring-[#5f7d5f]/20` | `focus:ring-brand-green/20` |
| Error texto | `text-[#8b5a44]` | `text-brand-coral` |
| Boton primario | `bg-[#5f7d5f]` | `bg-brand-green` |
| Boton hover | `hover:bg-[#537153]` | `hover:bg-brand-green-dark` |
| Boton texto | `text-[#f7f1e6]` | `text-white` |
| Boton disabled | `bg-[#b8b1a5]` | `bg-gray-300` |
| Error box borde | `border-[#e7c7b7]` | `border-red-200` |
| Error box fondo | `bg-[#fff0e8]` | `bg-red-50` |
| Error box texto | `text-[#8b3b2f]` | `text-brand-coral` |
| Link | `text-[#5f7d5f]` | `text-brand-green` |
| Link hover | `hover:text-[#2f4a2f]` | `hover:text-brand-green-dark` |
| Panel borde | `border-[#d7ccb8]` | `border-brand-green-light/50` |
| Panel fondo | `bg-[#fffaf2]` | `bg-white` |
| Panel sombra | `shadow-[0_20px_60px_-40px_...]` | `shadow-xl` |
| Panel info gradiente | `from-[#e6efe1] via-[#f1ebe0] to-[#d9ece7]` | `from-brand-green-light/30 via-brand-cream to-brand-green-light/20` |
| Panel info glow 1 | `bg-[#cfe2d4]/60` | `bg-brand-green-light/40` |
| Panel info glow 2 | `bg-[#d6c2a8]/60` | `bg-brand-orange/20` |
| Feature cards texto | `text-[#4d3b2f]` | `text-brand-navy` |
| Feature cards titulo | `text-[#2f5f52]` | `text-brand-green` |
| Feature cards borde | `border-[#d7ccb8]` | `border-brand-green-light/50` |
| Eyebrow panel | `text-[#4d8b7b]` | `text-brand-green` |
| Titulo panel h2 | `text-[#2f4a2f]` | `text-brand-navy` |

**Deuda tecnica aceptada:**
Login y Register comparten la misma estructura visual (grid 2 columnas, panel formulario + panel info, mismos estilos de input) pero no se propone extraer componentes compartidos (`FormInput`, `AuthShell`). Razon: solo son 2 paginas con este patron. Si se anade un tercer formulario de auth (ej: recuperar contrasena), entonces se deberia extraer. Por ahora, duplicar clases Tailwind entre 2 archivos es preferible a una abstraccion prematura.

**Como se integra:**
Es un cambio puramente visual. No afecta logica, validacion ni estructura HTML. El resultado sera visualmente identico al Login en cuanto a paleta, bordes, sombras y tipografia.

---

### 4.2 Tarea 2: Extraer hook useRecipes()

**Que se va a hacer:**
Extraer la logica de fetch de recetas que vive en `Home.jsx` a un hook reutilizable `useRecipes()`.

**Por que se hace asi:**
La nueva pagina `Explore.jsx` (Tarea 5) necesita exactamente la misma logica de carga que `Home.jsx`: llamar a `GET /api/recipes`, gestionar estados de `loading`/`error`/`recipes`, y manejar la estructura de respuesta de la API (`res.data?.data ?? res.data`). Sin un hook compartido, se duplicaria toda esta logica.

**Archivos afectados:**
- `src/hooks/useRecipes.js` (nuevo)
- `src/pages/Home.jsx` (refactor: consumir el hook en vez de logica inline)

**Que hay actualmente:**
En `Home.jsx` (lineas 14-29):
```jsx
const [recipes, setRecipes] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

useEffect(() => {
  async function load() {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/recipes");
      const data = res.data?.data ?? res.data;
      setRecipes(Array.isArray(data) ? data : []);
    } catch {
      setError("No se pudieron cargar las recetas.");
    } finally {
      setLoading(false);
    }
  }
  load();
}, []);
```

Esta misma logica se necesitaria copiar literalmente en `Explore.jsx`.

**Que se propone:**
Crear `src/hooks/useRecipes.js`:

```
useRecipes(endpoint = "/recipes")
  → { recipes, loading, error }
```

El hook encapsula:
- Estado de `recipes`, `loading`, `error`
- `useEffect` con fetch al endpoint dado
- Normalizacion de la respuesta (`res.data?.data ?? res.data`)
- Manejo de errores

`Home.jsx` pasa a consumir `const { recipes, loading, error } = useRecipes()`.
`Explore.jsx` consumira el mismo hook.

El parametro `endpoint` permite reutilizar el hook para otros listados en el futuro (ej: `useRecipes("/my-recipes")` en `MyRecipes.jsx`), aunque esa migracion no es parte de esta propuesta.

**Como se integra:**
Se crea la carpeta `src/hooks/` (no existe actualmente). `Home.jsx` se simplifica de ~57 lineas a ~30 al extraer la logica de fetch. No cambia nada visual ni funcional.

---

### 4.3 Tarea 3: Renombrar ProtectedLayout a AppLayout (layout unico)

**Que se va a hacer:**
Convertir el actual `ProtectedLayout.jsx` en un layout generico `AppLayout.jsx` que sirva tanto para rutas publicas como protegidas.

**Por que se hace asi:**
La propuesta original planteaba crear un `PublicLayout` separado de `ProtectedLayout`. Tras revision, ambos layouts tendrian exactamente la misma estructura visual:

```
min-h-screen bg-brand-cream
  Navbar
  main (px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto)
    Outlet
```

La unica diferencia seria el contenido que muestra el Navbar (botones de login vs UserBadge). Pero esa diferencia es responsabilidad del **Navbar** (que se adapta via props, ver Tarea 4), no del layout.

Crear dos layouts identicos que solo difieren en que pasan al Navbar es duplicacion innecesaria. Un unico `AppLayout` que monta un unico `Navbar` (el cual se adapta segun props) es mas limpio y mantenible.

**Archivos afectados:**
- `src/layouts/ProtectedLayout.jsx` → renombrar a `src/layouts/AppLayout.jsx`
- `src/main.jsx` (actualizar imports)

**Que hay actualmente:**
```jsx
// src/layouts/ProtectedLayout.jsx
export default function ProtectedLayout() {
  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />
      <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
```

**Que se propone:**
Renombrar a `AppLayout.jsx`. El componente pasa las props necesarias al Navbar para que este se adapte:

```
AppLayout
  → lee token y user de useAuth()
  → pasa isAuthenticated y user a Navbar como props
  → renderiza la misma estructura visual que ProtectedLayout
```

**Como se integra:**
Se usa en `main.jsx` tanto para rutas publicas como protegidas. La guarda de rutas (`ProtectedRoute`) sigue existiendo como wrapper para las rutas que requieren autenticacion, pero el layout visual es compartido.

---

### 4.4 Tarea 4: Adaptar Navbar para funcionar por props

**Que se va a hacer:**
Modificar `Navbar.jsx` para que reciba su estado de autenticacion por props en vez de consultarlo internamente, y renderice condicionalmente segun ese estado.

**Por que se hace asi:**
El Navbar actual (`Navbar.jsx`) asume siempre que hay sesion activa: muestra hamburguesa, sidebar con "Mis Recetas", y boton de logout. No tiene forma de funcionar en un contexto publico.

La alternativa de crear un `PublicNavbar.jsx` separado se descarta porque:
- Duplicaria logo, estilos sticky, responsive behavior, estructura HTML
- Cualquier cambio visual en la barra requeriria sincronizar dos archivos
- El mantenimiento a largo plazo seria peor

El Navbar debe ser un componente de **presentacion** que recibe datos y renderiza segun ellos, no un componente que consulta contexto global para decidir que mostrar.

**Archivos afectados:**
- `src/components/Navbar.jsx`

**Que hay actualmente:**
Navbar usa `useAuth()` internamente para obtener `setToken` y `setUser`, y asume sesion activa siempre.

**Que se propone:**
Navbar recibe props del layout padre:

```
<Navbar
  isAuthenticated={boolean}
  user={object|null}
  onLogout={function}
/>
```

**Comportamiento cuando `isAuthenticated = false` (publico):**
- Header: logo + botones "Iniciar sesion" / "Registrarse" (como `<Link>`)
- Sin hamburguesa
- Sin sidebar

**Comportamiento cuando `isAuthenticated = true` (autenticado):**
- Header: hamburguesa + logo + `<UserBadge>` (Tarea 8)
- Sidebar completo: Home, Mis Recetas, logout
- Comportamiento identico al actual con la adicion de UserBadge

**Cambio de responsabilidad:**
- Antes: Navbar llama a `useAuth()` y decide que renderizar
- Despues: `AppLayout` llama a `useAuth()` y pasa props al Navbar

Esto mantiene al Navbar como componente de presentacion y al layout como orquestador.

**Como se integra:**
`AppLayout` (Tarea 3) pasa las props necesarias. El Navbar ya no importa `useAuth` directamente. La funcion `handleLogout` se define en el layout (o se pasa como `onLogout`) para mantener la logica de limpieza de sesion centralizada.

---

### 4.5 Tarea 5: Crear pagina publica de recetas (Explore.jsx)

**Que se va a hacer:**
Crear una nueva pagina (`Explore.jsx`) que muestre el listado de todas las recetas accesible sin autenticacion. Sera la **nueva ruta raiz** (`/`) de la aplicacion.

**Por que se hace asi:**
La primera impresion de un usuario nuevo debe ser el producto, no un formulario de login. Mostrar las recetas directamente permite "probar antes de registrarse", reduce la friccion de entrada y alinea el frontend con la API publica que el backend ya expone.

**Archivos afectados:**
- `src/pages/Explore.jsx` (nuevo)

**Que hay actualmente:**
`Home.jsx` es la pagina que muestra todas las recetas, pero esta dentro de rutas protegidas.

**Que se propone:**
Crear `Explore.jsx` como thin wrapper que consume el hook `useRecipes()` (Tarea 2):

```
Explore.jsx
  → useRecipes() para obtener { recipes, loading, error }
  → useAuth() para comprobar si hay sesion (para el CTA)
  → PageHeader con titulo "Explora recetas"
  → LoadingSpinner / ErrorMessage / EmptyState (segun estado)
  → RecipeGrid (mismo componente que Home)
  → CTA sutil de registro al final (solo si !token)
```

**Por que Explore y Home como paginas separadas:**
Ambas comparten el hook `useRecipes()` y los componentes de presentacion, pero son **contextos funcionales distintos**:
- Explore: contexto publico, puede tener CTA de registro, titulo diferente
- Home: contexto autenticado dentro de `ProtectedRoute`, puede evolucionar a mostrar recomendaciones o filtros personalizados

La logica de fetch NO se duplica (vive en el hook). Solo difiere la capa de presentacion (~20 lineas de JSX).

**Como se integra:**
Se monta como hijo de `AppLayout` en la ruta `/`. Si el usuario ya esta autenticado y accede a `/`, vera las recetas con la barra en modo autenticado (UserBadge, hamburguesa). El CTA de registro se oculta si hay sesion activa.

---

### 4.6 Tarea 6: Mover RecipeDetail a ruta publica + fix navegacion

**Que se va a hacer:**
1. Hacer que la ruta `/recipes/:id` sea accesible sin autenticacion, dentro de `AppLayout`.
2. Cambiar `navigate(-1)` por `navigate("/")` en el boton "Volver".

**Por que se hace asi:**
El backend ya permite `GET /api/recipes/{id}` sin autenticacion. `RecipeDetail.jsx` no contiene ninguna logica que dependa del usuario (no muestra botones de editar/eliminar). Es un candidato natural para acceso publico.

El cambio de `navigate(-1)` a `navigate("/")` es necesario porque al convertir esta ruta en publica, se vuelve compartible/enlazable. Un usuario puede llegar directamente a `/recipes/5` sin historial de navegacion previo, y `navigate(-1)` lo sacaria de la aplicacion o no haria nada.

**Archivos afectados:**
- `src/main.jsx` (mover ruta fuera de ProtectedRoute)
- `src/pages/RecipeDetail.jsx` (cambiar `navigate(-1)` a `navigate("/")` en 2 sitios: boton normal linea 60, y boton de error linea 41)

**Que hay actualmente:**
```jsx
// RecipeDetail.jsx - boton volver (aparece 2 veces)
<button onClick={() => navigate(-1)} ...>Volver</button>
```

**Que se propone:**
```jsx
// RecipeDetail.jsx - boton volver determinista
<button onClick={() => navigate("/")} ...>Volver</button>
```

Esto siempre lleva al catalogo publico, que es el destino logico desde un detalle de receta. Es determinista y funciona tanto viniendo del listado como de un enlace directo.

**Como se integra:**
La ruta `/recipes/:id` se mueve dentro de `AppLayout` pero fuera de `ProtectedRoute`. El Navbar se adaptara automaticamente (via props del layout) mostrando la version publica o autenticada segun corresponda.

---

### 4.7 Tarea 7: Reestructurar rutas en main.jsx + actualizar enlaces

**Que se va a hacer:**
Reorganizar la estructura de rutas y actualizar todos los enlaces internos afectados por el cambio de la ruta raiz.

**Por que se hace asi:**
La estructura actual solo contempla dos niveles (publico = auth pages, protegido = todo lo demas). La nueva estructura necesita tres: auth pages (sin layout), paginas publicas con layout, y paginas protegidas con layout.

**Archivos afectados:**
- `src/main.jsx` (reestructuracion de rutas)
- `src/pages/Register.jsx` (link "Inicia sesion": `to="/"` → `to="/login"`)
- `src/auth/ProtectedRoute.jsx` (redireccion: `to="/"` → `to="/login"`)
- `src/components/Navbar.jsx` (redireccion post-logout: `navigate("/")` se mantiene, ahora apunta al catalogo)

**Que hay actualmente:**
```jsx
<Routes>
  <Route path="/" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route element={<ProtectedRoute />}>
    <Route element={<ProtectedLayout />}>
      <Route path="/home" element={<Home />} />
      <Route path="/my-recipes" element={<MyRecipes />} />
      <Route path="/my-recipes/:id/edit" element={<EditRecipe />} />
      <Route path="/recipes/:id" element={<RecipeDetail />} />
    </Route>
  </Route>
</Routes>
```

**Que se propone:**
```jsx
<Routes>
  {/* Auth pages — sin layout, full screen */}
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />

  {/* Paginas con shell visual (AppLayout) */}
  <Route element={<AppLayout />}>
    {/* Publicas — accesibles sin auth */}
    <Route path="/" element={<Explore />} />
    <Route path="/recipes/:id" element={<RecipeDetail />} />

    {/* Protegidas — requieren auth */}
    <Route element={<ProtectedRoute />}>
      <Route path="/home" element={<Home />} />
      <Route path="/my-recipes" element={<MyRecipes />} />
      <Route path="/my-recipes/:id/edit" element={<EditRecipe />} />
    </Route>
  </Route>
</Routes>
```

**Cambios clave:**
1. **`/` pasa de Login a Explore** → La raiz de la app es el catalogo publico de recetas
2. **Login se mueve a `/login`** → Ruta explicita para autenticacion
3. **`/recipes/:id` sale de protegidas** → Accesible sin auth, dentro de AppLayout
4. **Un solo AppLayout** envuelve tanto rutas publicas como protegidas
5. **ProtectedRoute se anida dentro de AppLayout** → Las rutas protegidas comparten el mismo shell visual

**Actualizacion de enlaces internos:**

| Archivo | Linea | Cambio |
|---------|-------|--------|
| `Register.jsx` | 206 | Link `to="/"` → `to="/login"` |
| `ProtectedRoute.jsx` | 7 | `<Navigate to="/" />` → `<Navigate to="/login" />` |
| `Login.jsx` | 18 | `<Navigate to="/home" />` — sin cambios, sigue siendo correcto |
| `Login.jsx` | 142 | Link `to="/register"` — sin cambios |
| `Navbar.jsx` | 20 | `navigate("/")` post-logout — sin cambios, ahora `/` es el catalogo (mejor UX) |

**Nota sobre la redireccion post-logout:**
El logout redirige a `/` (catalogo publico). El usuario sale de la sesion pero sigue viendo contenido util. Solo necesita ir a Login si quiere volver a entrar.

**Como se integra:**
Es el cambio central que habilita toda la reestructuracion. Debe implementarse junto con AppLayout (Tarea 3) y Explore (Tarea 5).

---

### 4.8 Tarea 8: Crear componente UserBadge + integrar en Navbar

**Que se va a hacer:**
Crear un componente reutilizable (`UserBadge.jsx`) que muestre la identidad del usuario logueado con acceso a logout, e integrarlo en el Navbar.

**Por que se hace asi:**
Actualmente no hay representacion visual del usuario en la interfaz. El boton de logout esta suelto en el header sin contexto de identidad. Un badge de usuario proporciona feedback visual de sesion activa, identificacion inmediata y un punto de acceso a logout.

**Archivos afectados:**
- `src/components/UserBadge.jsx` (nuevo)
- `src/components/Navbar.jsx` (integracion en la zona derecha del header)

**Prerequisito:** Tarea 0 (rehidratacion de user) debe estar completada para que `user` no sea `null` tras refresh.

**Que se propone:**
Crear `UserBadge.jsx` como componente de presentacion puro:

```
UserBadge (props: user, onLogout)
├── Inicial del nombre (letra en circulo, fondo brand-green-light/40)
├── Nombre del usuario (visible solo en sm+, truncado a ~15 chars)
└── Boton de logout (icono, siempre visible)
```

Especificaciones:
- Recibe `user` (objeto con `name`) y `onLogout` (callback) via props
- **Fallback cuando `user` es null:** muestra icono generico de usuario (silueta) sin nombre. El boton de logout sigue visible. Esto cubre el caso edge donde la rehidratacion falla o tarda.
- Diseno compacto, alineado con la estetica del header actual
- No necesita dropdown ni menu complejo en esta fase

**Integracion en Navbar:**
En el modo autenticado del Navbar (Tarea 4), la zona derecha del header reemplaza el boton coral de logout actual por:
```jsx
<UserBadge user={user} onLogout={onLogout} />
```

El sidebar mantiene su propio boton de logout independiente (redundancia util en mobile).

**Como se integra:**
`UserBadge` es un componente de presentacion puro que recibe props. No accede a Context ni a hooks de auth directamente. El Navbar (que ya recibe `user` y `onLogout` como props desde AppLayout) se los pasa.

---

### 4.9 Tarea 9 (opcional): Return-to tras login

**Que se va a hacer:**
Implementar redireccion a la ruta original tras login cuando el usuario fue redirigido desde una ruta protegida.

**Por que se hace asi:**
Actualmente, si un usuario intenta acceder a `/my-recipes` sin sesion, se le redirige a `/login` y tras autenticarse siempre va a `/home`. Con la nueva estructura (mas rutas publicas, mas puntos de entrada), es mas probable que los usuarios lleguen a rutas protegidas desde contextos variados.

**Archivos afectados:**
- `src/auth/ProtectedRoute.jsx` (pasar ruta original en `state`)
- `src/pages/Login.jsx` (leer `location.state` y redirigir si existe)

**Implementacion conceptual:**
```
ProtectedRoute:
  si no hay token → <Navigate to="/login" state={{ from: location.pathname }} />

Login (tras login exitoso):
  const from = location.state?.from || "/home"
  navigate(from, { replace: true })
```

**Esta tarea es opcional** porque no es bloqueante para el MVP. El flujo actual (siempre ir a `/home`) funciona. Pero es una mejora de UX sencilla (~4 lineas de cambio en total) que vale la pena considerar.

---

## 5. Arquitectura de componentes propuesta

### 5.1 Componentes nuevos

| Componente | Tipo | Ubicacion | Responsabilidad |
|-----------|------|-----------|-----------------|
| `useRecipes` | Hook | `src/hooks/useRecipes.js` | Logica compartida de fetch de recetas (loading, error, data) |
| `Explore` | Page | `src/pages/Explore.jsx` | Listado publico de recetas (nueva ruta raiz) |
| `UserBadge` | UI | `src/components/UserBadge.jsx` | Identidad visual del usuario + acceso a logout |

### 5.2 Componentes renombrados/refactorizados

| Componente | Cambio |
|-----------|--------|
| `ProtectedLayout` → `AppLayout` | Renombrado. Pasa a ser el layout unico para toda la app (publico y protegido). Lee auth y pasa props al Navbar. |
| `Navbar.jsx` | Refactorizado para recibir estado por props en vez de consultar useAuth. Renderiza condicionalmente segun `isAuthenticated`. |
| `Register.jsx` | Colores hardcoded reemplazados por tokens de marca. |
| `main.jsx` | Reestructuracion de rutas (3 niveles bajo un unico AppLayout). |
| `ProtectedRoute.jsx` | Redireccion a `/login` (en vez de `/`). |
| `RecipeDetail.jsx` | `navigate(-1)` → `navigate("/")`. |
| `Home.jsx` | Consume `useRecipes()` en vez de logica inline. |
| `AuthProvider.jsx` | Persistencia de `user` en sessionStorage. |

### 5.3 Componentes sin cambios (reutilizados tal cual)

| Componente | Usado en |
|-----------|----------|
| `RecipeGrid` | Explore (nuevo) + Home + MyRecipes |
| `RecipeCard` | Via RecipeGrid, en todas las vistas de listado |
| `PageHeader` | Explore + Home + MyRecipes |
| `LoadingSpinner` | Explore + Home + MyRecipes + EditRecipe + RecipeDetail |
| `ErrorMessage` | Explore + Home + MyRecipes + EditRecipe |
| `EmptyState` | Explore + Home + MyRecipes |
| `ConfirmModal` | MyRecipes |

### 5.4 Diagrama de relaciones

```
main.jsx (Router)
│
├── /login ............... Login.jsx (sin layout, full screen)
├── /register ............ Register.jsx (sin layout, colores unificados)
│
└── AppLayout.jsx (layout unico)
    │   ├── lee useAuth() → pasa isAuthenticated, user, onLogout a Navbar
    │   └── Navbar.jsx (renderiza segun props)
    │        ├── modo publico: logo + [Iniciar sesion] + [Registrarse]
    │        └── modo auth:    hamburguesa + logo + UserBadge
    │                           ├── Sidebar (Home, Mis Recetas, Logout)
    │                           └── UserBadge (inicial + nombre + logout)
    │
    ├── / .................. Explore.jsx (publica)
    │                         ├── useRecipes() hook
    │                         ├── PageHeader
    │                         ├── LoadingSpinner / ErrorMessage / EmptyState
    │                         ├── RecipeGrid → RecipeCard[]
    │                         └── CTA registro (si !token)
    │
    ├── /recipes/:id ....... RecipeDetail.jsx (publica, navigate("/"))
    │
    └── ProtectedRoute.jsx (guarda → redirige a /login)
        ├── /home .............. Home.jsx (useRecipes() hook)
        ├── /my-recipes ........ MyRecipes.jsx + ConfirmModal
        └── /my-recipes/:id/edit EditRecipe.jsx

AuthProvider (Context, envuelve todo, persiste token + user en sessionStorage)
```

---

## 6. Consideraciones de UX/UI

### 6.1 Decisiones de diseno

**Primera impresion = producto, no formulario:**
La ruta raiz pasa a ser el catalogo de recetas. Esto sigue el patron de plataformas como Pinterest, Unsplash o Medium, donde el contenido es lo primero y el registro es una invitacion, no un requisito.

**Navegacion publica minimalista:**
La barra publica muestra solo: logo + "Iniciar sesion" + "Registrarse". Sin hamburguesa ni sidebar, porque no hay opciones de navegacion que justifiquen un menu lateral para usuarios anonimos.

**UserBadge en vez de avatar circular:**
Se propone una inicial en circulo + nombre, no un avatar con foto. Razones:
- No se gestionan fotos de perfil en el backend actual
- Una inicial es mas ligera y no requiere carga de imagen
- Es mas coherente con la estetica actual (limpia, sin imagenes de perfil)
- Escalable: si en el futuro se anaden fotos de perfil, la estructura esta preparada

**Logout post-redireccion a catalogo:**
Al cerrar sesion, el usuario va al catalogo publico (/) en vez de al login. Esto es menos agresivo (no expulsa al usuario del contenido) y puede motivar a volver a loguearse al ver recetas.

**CTA de registro sutil en Explore:**
Si el usuario no esta logueado, al final del listado de recetas se puede mostrar un banner sutil invitando a registrarse. No debe ser un blocker ni un popup, sino un elemento contextual que refuerce el valor de registrarse ("Registrate para guardar tus propias recetas").

### 6.2 Consistencia visual

**Principio: un solo sistema de colores para toda la app.**
Despues de la Tarea 1, todas las pantallas usaran exclusivamente los tokens definidos en `tailwind.config.cjs`. No habra mas colores hardcoded.

**Misma estructura visual en publico y privado:**
- Mismo fondo: `bg-brand-cream`
- Misma barra superior: sticky, `bg-white/95`, `backdrop-blur-sm`, `border-b border-gray-200`
- Mismo contenedor de contenido: `max-w-7xl mx-auto` con paddings responsivos
- Mismo grid de recetas: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- Mismas tarjetas: `RecipeCard` con los mismos estilos, sombras y hover effects

La diferencia entre publico y privado sera solo el contenido de la barra de navegacion y las opciones disponibles, no la estructura visual. Esto se consigue con un **unico layout** (`AppLayout`) y un **unico Navbar** que se adapta por props.

### 6.3 Comportamiento esperado

**Flujo de usuario NO registrado:**
1. Llega a `/` → ve el catalogo de recetas con barra publica (logo + Login + Register)
2. Hace click en una receta → va a `/recipes/:id` con detalle completo
3. Puede navegar libremente entre catalogo y detalle
4. Si quiere crear/gestionar recetas → click en "Registrarse" o "Iniciar sesion"
5. Tras login/registro → redireccion a `/home` (experiencia completa)

**Flujo de usuario registrado:**
1. Si llega a `/` → ve el catalogo con barra autenticada (UserBadge, hamburguesa)
2. Puede acceder a `/home`, `/my-recipes`, editar, eliminar, etc.
3. Si hace logout → vuelve a `/` (catalogo publico)

**Flujo de acceso directo a ruta protegida sin sesion:**
1. Intenta acceder a `/my-recipes` → `ProtectedRoute` redirige a `/login`
2. Tras login → redireccion a `/home` (o a `/my-recipes` si se implementa Tarea 9)

**Flujo de acceso directo a receta via URL:**
1. Recibe un enlace a `/recipes/42` → ve el detalle con barra publica
2. Boton "Volver" lleva a `/` (catalogo), nunca fuera de la app

---

## 7. Consideraciones de accesibilidad

Se proponen las siguientes buenas practicas razonables, alineadas con el nivel de accesibilidad ya presente en el proyecto:

- **aria-label en botones de icono:** Los botones nuevos (UserBadge logout, links de navegacion publica) incluiran `aria-label` descriptivos, igual que el boton hamburguesa actual (`aria-label="Abrir menu"`).

- **Contraste de colores:** Los tokens de marca ya proporcionan buen contraste (brand-navy #1B2A4A sobre brand-cream #F8F6F3 = ratio ~12:1). Se mantendran estos ratios en los componentes nuevos.

- **Estructura semantica:** `AppLayout` usara `<header>` para la barra y `<main>` para el contenido. `Explore.jsx` usara `<section>` para el grid de recetas.

- **Navegacion por teclado:** Los enlaces de Login/Register en la barra publica seran elementos `<Link>` nativos de React Router (renderizados como `<a>`), no `<button>` con `onClick`, asegurando accesibilidad nativa (focusable, activable con Enter).

- **Indicador de foco visible:** Tailwind incluye `focus:ring-*` en los inputs y botones existentes. Se mantendra la misma convencion en los componentes nuevos.

- **Texto alternativo en imagenes:** `RecipeCard` ya proporciona `alt={recipe.titulo}` en las imagenes. `Explore.jsx` heredara esto al reutilizar `RecipeCard`.

---

## 8. Limitaciones conocidas (fuera de alcance)

Las siguientes limitaciones son **preexistentes** en el proyecto y no se abordan en esta propuesta. Se documentan para visibilidad:

### 8.1 Validacion de token (401 global)
No hay manejo global de tokens expirados o revocados. Si el token guardado ya no es valido, el usuario entra a la app pero las llamadas API fallan con 401. No existe un interceptor de respuesta que detecte el 401 y limpie la sesion automaticamente.

**Impacto:** Medio. El usuario ve errores genericos en vez de ser redirigido al login.
**Solucion futura:** Anadir un interceptor de respuesta en `axios.js` que detecte 401 y ejecute logout automatico.

### 8.2 Datos de usuario potencialmente desactualizados
Con la solucion de persistencia en sessionStorage (Tarea 0), el nombre del usuario podria estar desactualizado si se cambio desde otro dispositivo o directamente en la base de datos.

**Impacto:** Bajo. Las sesiones en sessionStorage ya se pierden al cerrar el navegador, y los usuarios de un MVP no suelen cambiar su nombre frecuentemente.
**Solucion futura:** Endpoint `GET /api/me` al arranque para validar token + refrescar datos de usuario.

### 8.3 Sin componentes de formulario compartidos
Login y Register comparten la misma estructura visual pero no extraen componentes reutilizables (`FormInput`, `AuthShell`). Esto es deuda tecnica **aceptada conscientemente**: con solo 2 formularios de auth, la abstraccion seria prematura. Si se anade un tercer formulario (ej: recuperar contrasena), se deberia extraer en ese momento.

---

## Resumen ejecutivo

| Aspecto | Estado actual | Estado propuesto |
|---------|:---:|:---:|
| Primera vista | Login | Catalogo de recetas |
| Acceso publico a recetas | No | Si |
| Acceso publico a detalle | No | Si |
| Consistencia visual Login/Register | Paletas diferentes | Paleta unificada |
| Identidad de usuario en Navbar | Ninguna | Nombre + inicial + logout |
| Rehidratacion de user tras refresh | No (user = null) | Si (sessionStorage) |
| Navegacion "Volver" en detalle | `navigate(-1)` (fragil) | `navigate("/")` (determinista) |

**Componentes nuevos:** 3 (hook `useRecipes`, pagina `Explore`, componente `UserBadge`)
**Componentes renombrados/refactorizados:** 8 (AppLayout, Navbar, Register, main.jsx, ProtectedRoute, RecipeDetail, Home, AuthProvider)
**Componentes existentes sin cambios:** 7 (RecipeGrid, RecipeCard, PageHeader, LoadingSpinner, ErrorMessage, EmptyState, ConfirmModal)

**Riesgos identificados y mitigados:**
- UserBadge con user null → fallback visual (icono generico)
- navigate(-1) en ruta publica → cambiado a navigate("/")
- Links a "/" rotos → actualizados a "/login" donde corresponde
- Duplicacion Explore/Home → logica compartida via hook

**Cambios backend necesarios:** Ninguno. La API ya expone endpoints publicos de lectura desde el fix del 23/03/2026. La rehidratacion de user se resuelve con sessionStorage (sin endpoint adicional).
