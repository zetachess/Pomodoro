# Política de seguridad

## Alcance

Este proyecto es una aplicación estática que se ejecuta en el navegador. No tiene backend propio, autenticación ni base de datos remota. Las áreas especialmente relevantes son:

- manipulación de datos persistidos en `localStorage`;
- ejecución de enlaces externos y compartir el resumen diario;
- permisos de notificaciones y reproducción de audio;
- dependencias de build y configuración de Vite.

## Versiones compatibles

La rama `main` es la única versión mantenida activamente. Las versiones publicadas pueden quedar sin soporte cuando cambie la arquitectura.

## Cómo informar de una vulnerabilidad

No publiques credenciales, datos personales ni una prueba de concepto explotable en una issue pública. Usa las **Security Advisories** privadas de GitHub si están habilitadas para el repositorio. Si no lo están, abre una issue mínima indicando únicamente “security report” y solicita un canal privado.

Incluye, si es posible:

- descripción y posible impacto;
- pasos reproducibles sin datos sensibles;
- versión, navegador y sistema operativo;
- archivo o componente afectado;
- propuesta de mitigación.

Responderemos cuando podamos confirmar la recepción, evaluaremos el alcance y coordinaremos la publicación de la solución. No garantizamos un plazo concreto de respuesta.

## Límites de privacidad

La aplicación no pretende ser un almacén seguro. `localStorage` no debe contener contraseñas, tokens, datos médicos, información financiera ni otra información sensible. Cualquier extensión o script con acceso al mismo origen podría leer esos datos.
