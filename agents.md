# agents.md — Reglas y límites para la IA

Este archivo define qué SÍ y qué NO puede hacer Cursor (o cualquier agente de IA) al trabajar en este
repositorio. Es el primero que la IA debe leer antes de generar cualquier código.

## Seguridad (no negociable)

- **Nunca** exponer `ANTHROPIC_API_KEY` (ni ninguna otra credencial) en código que se ejecute en el
  cliente (componentes con `"use client"`, código en `/app` que no sea API Route). Todas las llamadas
  a la API de Anthropic deben pasar por una API Route del servidor que actúa como proxy.
- **Nunca** commitear `.env.local` ni ningún archivo con secretos reales. Solo `.env.example` con
  claves vacías o placeholders (`ANTHROPIC_API_KEY=your_key_here`).
- **Siempre** validar y sanitizar el archivo subido por el usuario (tipo MIME, extensión, tamaño
  máximo) antes de procesarlo. Nunca confiar en la extensión del nombre de archivo por sí sola.
- **Nunca** loguear el contenido completo de un CV o la respuesta cruda del modelo en producción
  (puede contener datos personales sensibles). Loguear solo metadatos (tamaño del archivo, paso del
  pipeline, tipo de error).

## Patrones prohibidos

- No usar `any` en TypeScript sin un comentario `// any porque: <razón>` justificando por qué no se
  pudo tipar.
- No dejar `console.log` de depuración en código que se sube a `main`.
- No usar `catch (e) {}` vacío o silencioso. Todo catch debe registrar el error con contexto y
  devolver un estado manejable al usuario.
- No usar estilos inline cuando ya existe una clase de Tailwind equivalente.
- No crear componentes de más de ~200 líneas; si un componente crece más que eso, es señal de que
  debe dividirse.

## Cómo debe comportarse la IA (Execution Loop de GenDD)

- Antes de generar código para una tarea nueva o no trivial, la IA debe **proponer un plan corto**
  (qué archivos va a tocar o crear, qué enfoque va a seguir) y esperar confirmación explícita antes
  de ejecutar.
- Para decisiones que afectan arquitectura (cambiar de librería, cambiar el schema de datos, cambiar
  el enfoque de extracción), la IA debe señalar explícitamente que es una decisión de arquitectura y
  pedir confirmación, no decidir por su cuenta.
- Preferir funciones pequeñas y de una sola responsabilidad sobre funciones largas que hacen varias
  cosas.
- Preferir tipos explícitos sobre inferencia implícita en las interfaces públicas (props de
  componentes, retornos de funciones exportadas).

## Alcance del proyecto (para evitar scope creep)

- Este es un proyecto de una semana para un reto técnico. No agregar autenticación, base de datos,
  paneles de administración, ni ninguna funcionalidad que no esté en `context.md` o en el roadmap
  acordado, sin confirmarlo primero.
