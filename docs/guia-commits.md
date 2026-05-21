# Guia de commits y trabajo en el repo

Este repo publico trabaja desde la rama principal:

```bash
main
```

Remoto configurado:

```bash
origin https://github.com/nldb932005dev/Foodsynk_front.git
```

## Antes de empezar

Trabajar siempre desde la copia limpia del repo publico, no desde la carpeta antigua con historial privado.

```bash
cd C:\tmp\Foodsynk-front-public-20260520-234627
git branch --show-current
git status
git pull --ff-only
```

La rama debe ser `main` y el estado debe estar limpio antes de empezar cambios nuevos.

## Que no se debe commitear

No subir nunca:

- `.env`, `.env.local`, `.env.production`
- `node_modules/`
- `dist/`
- documentos privados `*.pdf` o `*.docx`
- logs internos o diarios de trabajo
- claves, tokens, credenciales o configuracion local del servidor

Solo se debe subir `.env.example` como plantilla publica.

## Flujo normal de trabajo

1. Actualizar el repo.

```bash
git pull --ff-only
```

2. Hacer los cambios en codigo o documentacion publica.

3. Revisar el estado.

```bash
git status
```

4. Ejecutar validaciones antes de commitear.

```bash
npm.cmd run lint
npm.cmd run build
```

Si se trabaja en Linux o en el servidor por SSH, usar:

```bash
npm run lint
npm run build
```

5. Anadir solo los archivos correctos.

```bash
git add ruta/del/archivo
```

Evitar `git add .` si hay dudas. Antes de confirmar:

```bash
git diff --cached --name-only
```

6. Crear el commit.

```bash
git commit -m "tipo: descripcion breve"
```

Tipos recomendados:

- `feat`: funcionalidad nueva
- `fix`: correccion de error
- `docs`: cambios de documentacion
- `style`: cambios visuales o CSS sin cambiar logica
- `refactor`: reorganizacion interna sin cambiar comportamiento
- `chore`: tareas de mantenimiento

Ejemplos:

```bash
git commit -m "feat: anadir filtro por tiempo en recetas"
git commit -m "fix: corregir redireccion tras login"
git commit -m "docs: actualizar guia de despliegue"
```

7. Subir a GitHub.

```bash
git push origin main
```

## Despliegue por SSH

En el servidor, las variables reales se crean manualmente en `.env` o `.env.production`. No se suben al repo.

Despues de hacer pull en el servidor:

```bash
git pull --ff-only
npm ci
npm run build
```

Vite incrusta las variables `VITE_*` durante el build. Si cambia una variable del entorno, hay que volver a ejecutar `npm run build`.

## Regla de seguridad antes de cada push

Antes de subir:

```bash
git status
git diff --cached --name-only
```

Si aparece un archivo privado, de entorno, binario o de logs internos, quitarlo del commit:

```bash
git restore --staged ruta/del/archivo
```

