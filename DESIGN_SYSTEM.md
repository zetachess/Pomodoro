# Sistema visual de POMODORO TIMER

## Dirección

La interfaz adopta la identidad de un reloj de estudio cálido: carbón con matiz espresso, coral tomate para el foco y verde salvia para los descansos. El aro circular del temporizador y el tomate dibujado en CSS son los elementos distintivos. Se mantiene el producto en español y el modo oscuro permanente.

## Tokens y componentes

- **Superficies:** `--canvas`, `--surface`, `--surface-raised` y `--surface-high`, en carbón cálido con elevación gradual.
- **Color semántico:** `--accent` coral para foco y acciones; `--mint` para descansos; `--amber` para rachas; `--danger` para acciones destructivas. Texto primario y secundario usan `--ink` y `--muted`.
- **Tipografía:** Plus Jakarta Sans para interfaz, DM Mono para tiempo y datos, Instrument Serif en acentos editoriales.
- **Ritmo y forma:** pasos de 4/8 px, radios pequeños/medianos/amplios y sombras contenidas definidos como variables CSS.
- **Componentes:** paneles compartidos, controles táctiles de al menos 44 px, foco visible, navegación inferior en móvil y rail lateral desde 1100 px.

## Responsive y accesibilidad

El orden móvil presenta primero temporizador y tareas, después métricas e historial semanal. Las vistas de historial, ajustes y guía conservan el mismo lenguaje visual. Se soportan `prefers-reduced-motion`, contraste legible y anchos de 375, 390 y 430 px, además de tablet y escritorio.

## Alcance de datos

Este rediseño preserva la lógica y los datos existentes del Pomodoro. No agrega citas hasta disponer de una fuente auténtica en español; no se traduce ni se inventa contenido.
