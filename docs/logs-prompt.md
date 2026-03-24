# Prompt maestro para continuar `docs/logs.md`

Usa siempre este prompt cuando quieras seguir escribiendo el diario técnico del proyecto.

## Instrucciones

1. Abre y continúa el archivo `docs/logs.md`.
2. Si la fecha actual ya existe en el archivo, añade nuevas entradas al final de esa fecha.
3. Si es un nuevo día, crea una nueva cabecera con formato `# YYYY-MM-DD`.
4. Registra todo en orden cronológico.
5. Añade la hora de cada bloque con formato `[HH:mm]`.
6. En `**chat**`, guarda el prompt del usuario y la respuesta generada.
7. En `**Cambios**`, documenta solo archivos realmente modificados.
8. En `que había` y `resultado final`, usa solo fragmentos relevantes del archivo, nunca el archivo completo.
9. En `que se cambia y por qué`, explica el cambio propuesto o aplicado y el motivo técnico o funcional.
10. En `**Nuevo**`, documenta cada archivo nuevo con su nombre, propósito, contenido y explicación breve.
11. No abras un archivo de log nuevo por día: todo se sigue escribiendo en `docs/logs.md`.
12. Mantén el contenido en Markdown válido y legible.

## Formato a seguir

~~~md
# YYYY-MM-DD

**chat**:

**prompt**:

```text
[prompt del usuario]
```

**respuesta**:

```text
[respuesta generada]
```

[HH:mm]

**Cambios**:

archivo: `ruta/o/nombre`

que había:

```text
[fragmento relevante anterior]
```

que se cambia y por qué:

```text
[explicación del cambio]
```

resultado final:

```text
[fragmento relevante final]
```

[HH:mm]

**Nuevo**:

`nombre-del-archivo`

[para qué es el archivo]

[qué tiene]

[explicación breve]

[HH:mm]
~~~

## Prompt reutilizable

```text
Continúa el archivo docs/logs.md y documenta esta sesión de trabajo.

Reglas:
- Si la fecha de hoy ya existe, escribe al final de esa fecha.
- Si no existe, crea una nueva cabecera con formato # YYYY-MM-DD.
- Registra el chat de esta sesión con el prompt del usuario y la respuesta generada.
- Documenta los cambios reales en archivos bajo la sección **Cambios**.
- Documenta cada archivo nuevo bajo la sección **Nuevo**.
- Usa horas con formato [HH:mm].
- En “que había” y “resultado final”, usa solo fragmentos relevantes, no archivos completos.
- Mantén orden cronológico y Markdown válido.
- Todo debe seguir escribiéndose en docs/logs.md, sin crear un log distinto por día.
```
