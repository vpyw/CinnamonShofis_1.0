# 🍥 CinnamonShofis — Inventario, menú y pedidos

Panel web para una repostería, diseñado para utilizarse **en computadoras y celulares**. Está hecho con HTML, CSS y JavaScript puro: **no necesitas instalar Node.js, bases de datos ni dependencias** para publicarlo en GitHub Pages.

## ¿Qué hace?

- **Resumen:** ventas y pedidos del día, unidades disponibles y alertas por inventario bajo.
- **Nuevo pedido:** agrega varios tipos de roles y otros productos, cambia las cantidades y calcula subtotal, descuento, costo de entrega, total y cambio en pagos en efectivo.
- **Inventario:** crea, modifica y elimina productos, actualiza sus existencias, precios y mínimos, y muestra alertas por bajo inventario.
- **Menú:** muestra los productos activados en el inventario, con precios en pesos mexicanos. Puedes imprimirlo o guardarlo en PDF con la función de impresión del navegador.
- **Historial:** guarda cada venta, el cliente, productos, cantidades, forma de pago y notas. Permite cancelar una venta y devolver las unidades a las existencias.
- **Respaldos:** descarga un archivo `.json` con tus productos y ventas o importa uno para restaurar la información.
- **Celular y PC:** diseño responsivo; una vez publicada por HTTPS y visitada por primera vez, puedes instalarla como aplicación web y abrirla sin conexión (PWA).

> **Importante:** los primeros cinco productos y sus precios/stock son **datos de ejemplo**. Puedes editar o eliminarlos y sustituirlos por los reales.

## 🚀 Publicarla gratis en GitHub Pages

1. Inicia sesión en [GitHub](https://github.com/) y crea un repositorio nuevo, por ejemplo `CinnamonShofis` (puede ser público).
2. Extrae el archivo ZIP del proyecto. **Sube los archivos que están dentro de la carpeta a la raíz del repositorio**; el archivo `index.html` debe quedar directamente en la raíz, no dentro de una carpeta adicional.
3. Confirma los archivos con **Commit changes**.
4. Abre **Settings → Pages** en el repositorio.
5. En **Build and deployment**, selecciona **Deploy from a branch**.
6. Elige la rama **main** y la carpeta **/(root)**; pulsa **Save**.
7. GitHub mostrará un enlace parecido a `https://TU-USUARIO.github.io/CinnamonShofis/`. Ábrelo desde tu PC o celular.

Al cambiar el contenido del proyecto, confirma tus cambios en GitHub. Si modificas archivos importantes de la aplicación, incrementa la versión `CACHE_NAME` en `service-worker.js` para renovar el caché sin conexión.

## 🍰 Cómo usarla

**Crear o editar un producto:** pulsa **Agregar producto**. Captura el nombre, precio de venta, existencias y el mínimo que activa la alerta. Si seleccionas **Mostrar en el menú**, se podrá añadir a los pedidos siempre que haya stock. También puedes cambiar la visibilidad desde la columna **Menú** del inventario.

**Registrar una venta:** abre **Nuevo pedido** y toca los productos. Usa los botones `+` y `−` para ajustar cantidades. Puedes añadir descuento, envío, nombre del cliente y notas. Si cobra en efectivo, escribe el importe recibido para calcular el cambio. Pulsa **Confirmar pedido**; se descuenta el stock automáticamente.

**Cancelar una venta:** entra a **Historial**, despliega el pedido y elige **Cancelar y devolver al inventario**. El ticket se conserva como cancelado, la venta deja de sumar y el stock se restaura. Por seguridad, no se permite eliminar definitivamente un producto utilizado por una venta todavía cancelable (puedes ocultarlo del menú).

**Mover tus datos a otro teléfono/computadora:** pulsa **Respaldo** para descargar el archivo JSON. En el segundo dispositivo abre la misma página y utiliza **Importar respaldo** (abajo). **Esto reemplaza los datos del segundo dispositivo** por el respaldo; no combina ventas de los dos dispositivos.

**Instalar en el celular:** abre la página publicada por HTTPS, y utiliza la opción **Agregar a pantalla de inicio** del navegador compatible. En escritorio, algunos navegadores mostrarán una opción para instalar la aplicación.

## ⚠️ Dónde se almacenan los datos

Este proyecto usa `localStorage` del navegador. **No tiene servidor, cuentas de usuario ni sincronización automática**. Por lo tanto:

- Cada navegador/dispositivo guarda su propio inventario e historial. Si abres la página en un teléfono y en una computadora, **NO verás los mismos datos automáticamente**.
- Los datos permanecen al cerrar y abrir la página normalmente, pero podrían perderse si se eliminan los datos del sitio, se usa navegación privada o se cambia de dispositivo.
- Descarga respaldos JSON con frecuencia, especialmente antes de actualizar la aplicación o cambiar de navegador.
- Publicar el código en GitHub no publica ni guarda allí tus pedidos ni tu inventario. Los datos quedan en el navegador en que los registraste.
- El sitio no exige contraseña. Para **trabajar con un inventario único desde varios dispositivos en tiempo real**, necesitas una base de datos y autenticación (por ejemplo Supabase o Firebase). Eso no está incluido en esta versión.

## Estructura del proyecto

```text
CinnamonShofis/
├── index.html            # Estructura de las pantallas
├── styles.css            # Diseño adaptable a PC y móvil
├── app.js                # Inventario, pedidos, cálculos y guardado local
├── favicon.svg           # Logotipo pequeño
├── icon-192.png          # Ícono para instalar la aplicación
├── icon-512.png          # Ícono para instalar la aplicación
├── manifest.webmanifest  # Configuración de la app instalable
├── service-worker.js     # Archivos sin conexión (caché)
├── LICENSE               # Licencia MIT
└── README.md             # Estas instrucciones
```

### Tecnología

HTML5, CSS3 y JavaScript sin frameworks. Los importes se guardan en centavos para evitar errores habituales de sumas con decimales. Los datos se validan al importar un respaldo. Los nombres y notas ingresados por los usuarios se escapan al renderizar en HTML.

## Ejecutar localmente (opcional)

Puedes abrir `index.html` directamente, pero para probar el modo instalable y el caché sin conexión es preferible ejecutarlo desde un servidor local o desde GitHub Pages:

```bash
python -m http.server 8000
```

Después abre `http://localhost:8000` en tu computadora.

## Licencia

MIT. Puedes modificar, personalizar y usar este código para tu repostería.
