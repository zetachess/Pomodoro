# Pomodoro Timer

Una aplicación Pomodoro para convertir una tarea grande en bloques pequeños de concentración. Está pensada para usarse sin cuenta y sin servidor: tus tareas, sesiones y preferencias se guardan únicamente en el almacenamiento local de tu navegador.

![Pomodoro Timer](public/pomodoro-timer.png)

## Qué incluye

- Temporizador de Focus con pausas cortas y largas configurables.
- Lista de tareas con edición, completado y vinculación al temporizador.
- Historial de sesiones, racha y resumen de la semana.
- Logros y resumen diario para copiar o compartir por WhatsApp.
- Notificaciones del navegador y aviso sonoro opcionales.
- Diseño responsive para móvil, tablet y escritorio.
- Interfaz en español, sin backend, cuentas ni analítica integrada.

## Requisitos

- Node.js 20 o superior.
- npm 10 o superior.

## Desarrollo local

```bash
npm install
npm run dev
```

Abre la URL que muestre Vite, normalmente `http://localhost:5173`.

## Comprobaciones antes de publicar

```bash
npm run lint
npm run build
```

El build genera la carpeta `dist/`, que puede servirse como sitio estático.

## Arquitectura

```text
src/
├── App.tsx                 # Vistas y flujo principal de la aplicación
├── types/                  # Tipos y valores iniciales del dominio
├── hooks/                  # Persistencia React reutilizable
└── utils/
    ├── pomodoro.ts         # Cálculos y formato del temporizador
    └── storage.ts          # Claves y validación de datos persistidos
```

La aplicación es una SPA de React + TypeScript construida con Vite. No realiza peticiones de red durante el uso normal. Los enlaces de WhatsApp y las notificaciones solo se activan cuando el usuario los solicita.

## Privacidad y almacenamiento

Los datos se guardan en `localStorage` bajo estas claves:

- `pomogoblin-settings`
- `pomogoblin-tasks`
- `pomogoblin-sessions`
- `pomogoblin-timer`
- `pomogoblin-active-task`

No se envían a ningún servidor. Puedes borrar todo desde **Ajustes → Borrar datos locales**. El contenido guardado en el navegador puede ser leído o modificado por cualquier código que se ejecute con el mismo origen; no guardes secretos ni información sensible.

## Seguridad

Consulta [SECURITY.md](SECURITY.md) para informar de vulnerabilidades. La guía también documenta el modelo de seguridad y los límites de privacidad del proyecto.

## Contribuir

1. Crea un fork y una rama descriptiva.
2. Instala las dependencias con `npm install`.
3. Haz cambios pequeños y explica cualquier decisión de producto.
4. Ejecuta `npm run lint` y `npm run build`.
5. Abre un pull request con el problema, la solución y cómo lo has probado.

Para cambios visuales, incluye una captura de escritorio y otra móvil cuando sea posible. Evita añadir dependencias o telemetría sin explicar su impacto en privacidad y mantenimiento.

## Licencia

Este proyecto se distribuye bajo la licencia MIT. Consulta [LICENSE](LICENSE).
