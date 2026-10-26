# La Mansión Watersdown — Invitaciones web 🕯️🔒

Web de invitaciones para la *murder party* **Cómo Organizar un Asesinato: El Caso de la Mansión Watersdown** (Yorkshire, 1936).

Hay **un único enlace para todas**. Al abrirlo aparece la puerta de la mansión y el mayordomo pide la contraseña. Cada invitada tiene **su propia contraseña** (la respuesta de un acertijo que le envías tú en privado); al acertarla, se abre **su** invitación personalizada con la ficha de su personaje.

> **Sin spoilers:** la web solo contiene información pública del juego. Nada de motivos, secretos ni pistas sobre quién es la asesina.

---

## 📁 Qué hay aquí

| Archivo / carpeta | Para qué sirve |
|---|---|
| `contrasenas.json` | **La contraseña de cada invitada.** Edítalo para cambiarlas. **No se publica** (no se copia a `dist/`). |
| `data/config.json` | **Los datos de tu fiesta real** (anfitriona, fecha, hora, dirección, WhatsApp). |
| `data/characters.json` | Biografías y vestuario públicos de los 8 personajes. |
| `data/textos.json` | Textos compartidos (invitación, carta de la secretaria, horario). |
| `build.mjs` | El "cocinero": genera la web a partir de los datos. |
| `dist/` | **La web ya generada y lista para publicar.** |
| `server.mjs` | Opcional, para ver la web en tu ordenador antes de publicar. |

---

## ✍️ Paso 1 — Datos de tu fiesta

Abre `data/config.json` y rellena lo que va entre corchetes (anfitriona, fecha, hora, dirección, código de vestimenta, WhatsApp, y la fecha/hora del botón "Añadir al calendario"). Si quieres, en `"siteUrl"` pones la dirección pública una vez publicada (para que el enlace se vea bonito al compartirlo).

## 🔑 Paso 2 — Contraseñas (opcional, ya vienen puestas)

Las contraseñas están en `contrasenas.json`, una por invitada. Para **cambiar una**, edita su valor y vuelve a generar (paso 3). Por ejemplo:

```json
"Donna": "moneda"
```

- Al comprobar, da igual cómo la escriba la invitada: se aceptan **mayúsculas, tildes y diéresis, espacios y puntuación**, e incluso un **artículo inicial** ("el", "la", "un", "una"). Así «Telón», «TELON», « telón. » y «el telón» valen todas.
- Importante: **el acertijo no está en la web**. Tú se lo envías a cada invitada en privado; la web solo comprueba la respuesta.
- La contraseña nunca se guarda en la web: de cada una se calcula un código (SHA-256) que da nombre a una carpeta secreta. Por eso nadie puede entrar escribiendo un nombre de personaje en la URL.

## 🔁 Paso 3 — Genera la web

Necesitas **Node.js** (gratis): <https://nodejs.org> → botón "LTS" → instalar con *Siguiente → Siguiente*. Luego, en esta carpeta, abre una terminal y ejecuta:

```bash
node build.mjs
```

Esto crea/actualiza **`dist/`** y, al terminar, imprime en pantalla las rutas secretas generadas. Repite este paso cada vez que cambies un dato o una contraseña.

> (Opcional) Para verla en tu ordenador antes de publicar: `node server.mjs` y abre <http://localhost:8099>.

## 🚀 Paso 4 — Publícala gratis

Publicas **solo el contenido de la carpeta `dist/`** (el archivo `contrasenas.json` se queda en tu ordenador; no se sube). Elige una opción:

- **Netlify (lo más fácil):** entra en <https://app.netlify.com/drop> y arrastra la carpeta **`dist`**. Te da una dirección al instante.
- **GitHub Pages:** sube el contenido de `dist/` a un repositorio y actívalo en *Settings → Pages*. El `.nojekyll` ya incluido evita problemas.
- **Vercel:** importa el proyecto indicando `dist` como carpeta de salida.

## 🔗 Paso 5 — Reparte

- **A todas** les envías el **mismo** enlace: `https://TU-DIRECCION/CasoDeLaMansionWatersdown/`
- **A cada una, en privado**, le mandas **su acertijo** (cuya respuesta es su contraseña). Los acertijos los redactas tú; no están en la web.

Y ya está: cada invitada abre la puerta, susurra su contraseña y entra en su propia invitación. Si marca "Recordarme en este dispositivo", la próxima vez entrará directa; siempre puede pulsar *"¿No es su invitación? Cambiar de invitada"* para volver a la puerta.

---

## ❓ Dudas rápidas

- **Cambié algo pero no se ve.** ¿Ejecutaste `node build.mjs` y volviste a publicar la carpeta `dist`?
- **¿Dónde veo las rutas secretas?** Las imprime `node build.mjs` al terminar. No hace falta conocerlas: las invitadas solo usan la puerta + su contraseña.
- **Una invitada no puede entrar.** Comprueba que su contraseña en `contrasenas.json` coincide con la respuesta del acertijo que le enviaste (sin preocuparte por mayúsculas o tildes).
- **Los buscadores no indexarán las invitaciones** (llevan `noindex`) y ninguna página enlaza a otra: solo se llega con la contraseña.

¡Que tengan una agradable (y misteriosa) estancia en la Mansión Watersdown! ♦
