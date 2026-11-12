# ICE CLUB — Marcianos gourmet artesanos

Landing responsive para ICE CLUB, con catálogo de sabores, puntos de entrega en la UNJFSC, carrito y confirmación de pedido por WhatsApp. La web y la app nativa viven en `apps/web` y `apps/mobile`; si Supabase no está configurado, la web usa los datos locales de `apps/web/data/mock.ts`.

## Desarrollo

```bash
Set-Location apps\web
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Abre `http://localhost:3000`. `npm run build` genera una exportación web estática en `apps/web/out/`. Para revisar el sitio mientras desarrollas, usa `npm run dev` desde `apps/web`.

## Supabase

1. Crea un proyecto y ejecuta [`apps/web/supabase/schema.sql`](./apps/web/supabase/schema.sql) en el SQL Editor.
2. Copia las claves del proyecto a `.env.local`:

   ```env
   NEXT_PUBLIC_SITE_URL=https://tu-dominio.pe
   NEXT_PUBLIC_WHATSAPP_NUMBER=51999999999
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-publica
   ```

3. La landing lee productos y puntos de entrega, y crea pedidos pendientes. La política no habilita lecturas públicas de `orders`.
4. Sin ambas variables, se usan los datos mock de [`apps/web/data/mock.ts`](./apps/web/data/mock.ts).
5. Si ya tenías una base ICE CLUB, ejecuta [`apps/web/supabase/migrations/20261111_v2_delivery_address.sql`](./apps/web/supabase/migrations/20261111_v2_delivery_address.sql) para guardar la dirección y permitir que hora y medio de pago sean opcionales.
6. Para actualizar los precios en una base existente, ejecuta [`apps/web/supabase/migrations/20261112_update_marciano_prices.sql`](./apps/web/supabase/migrations/20261112_update_marciano_prices.sql) en el SQL Editor de Supabase.

Los precios actuales son S/ 1.50 para Fresa y Maracuyá, y S/ 2.00 para Lúcuma, Mango y Coco. Para agregar sabores o puntos, modifica el seed en `apps/web/supabase/schema.sql` y los datos de respaldo en `apps/web/data/mock.ts`. Usa rutas locales de `apps/web/public/` para las imágenes.

## Modelo 3D

El directorio inicial no incluía un archivo 3D: únicamente había fotos bajo `apps/web/fotos/`. Por eso no se generó un GLB, no se pueden enumerar los nombres reales de mallas/materiales ni verificar escala u orientación. La landing mantiene la imagen de producto como fallback y activa la escena WebGL cuando exista `apps/web/public/models/ice-club.glb`. En una carga fallida, dispositivo de baja potencia o modo de movimiento reducido, conserva la imagen estática.

Cuando tengas el modelo:

1. Conserva el archivo original fuera de `apps/web/public/` y copia una versión de trabajo sin sobrescribirlo.
2. Convierte el formato de origen a GLB con la herramienta correspondiente (por ejemplo, Blender en modo headless o `obj2gltf` para OBJ).
3. Instala la herramienta de optimización y revisa el modelo:

   ```bash
   Set-Location apps\web
   npm install --no-save @gltf-transform/cli
   npx gltf-transform inspect .\modelo-original.glb
   ```

4. Optimiza texturas a 1024 px y aplica Draco:

   ```bash
   npx gltf-transform optimize .\modelo-original.glb .\public\models\ice-club.glb --texture-size 1024 --texture-compress webp --compress draco
   ```

5. Comprueba el tamaño y vuelve a inspeccionarlo. El objetivo es menos de 2 MB; la compresión final depende de la geometría y las texturas de origen.

La escena centra el modelo con su caja envolvente, lo escala a una altura visual uniforme y crea dos instancias inclinadas con tintes diferentes. La disponibilidad se detecta en el build, para que funcione también con los assets estáticos de Vercel; reinicia `npm run dev` al añadir o reemplazar el GLB. Si el GLB ya contiene la pareja, elimina la duplicación en `apps/web/components/IceScene.tsx`. Si queda tumbado, ajusta la rotación inicial de cada grupo en ese archivo; si ocupa demasiado espacio, ajusta el factor `2.45 / maxAxis`.

## Assets y supuestos pendientes

- Se copiaron a `apps/web/public/assets/` la foto del producto, una foto de marcianos, una composición con varios sabores y cristales de hielo. Los originales en `apps/web/fotos/` no se modificaron.
- No se suministró un GLB, un mapa real del campus ni cuentas sociales.
- Configura `NEXT_PUBLIC_WHATSAPP_NUMBER` con el número real (código de país, sin `+` ni espacios). Actualiza también el enlace de Instagram.
- La vista AR no aparece porque no se incluyó un GLB ni un visor `<model-viewer>`.
- Define `NEXT_PUBLIC_SITE_URL` con el dominio final y reemplaza `iceclub.example` en `apps/web/app/robots.ts` y `apps/web/app/sitemap.ts`.

## Publicar en GitHub y Vercel

Repositorio: [Cristian-code24/ICE-CLUB](https://github.com/Cristian-code24/ICE-CLUB).

1. En Vercel, selecciona **Add New → Project** e importa `Cristian-code24/ICE-CLUB`.
2. Configura **Root Directory** como `apps/web`. El archivo [`apps/web/vercel.json`](./apps/web/vercel.json) fija el preset Next.js, `npm ci` y `npm run build`. Deja **Output Directory** sin sobrescribir: Next.js necesita su directorio de build para generar `routes-manifest.json`, aunque la exportación estática se escriba en `out/`.
3. Configura `NEXT_PUBLIC_WHATSAPP_NUMBER`. Si usarás Supabase, agrega también `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`. El dominio SEO se toma de `VERCEL_PROJECT_PRODUCTION_URL`; puedes sobrescribirlo con `NEXT_PUBLIC_SITE_URL`.
4. Pulsa **Deploy**. Vercel vuelve a desplegar automáticamente los siguientes cambios de la rama `main`.

El workflow de GitHub Actions ejecuta ESLint y una compilación de producción en cada push a `main` y en cada pull request.

## App Android instalable (APK)

El proyecto está preparado como app híbrida con Capacitor 8. El APK incluye el sitio estático y sus imágenes, por lo que la interfaz abre sin conexión; Supabase y WhatsApp sí necesitan Internet.

### Requisitos para compilar el APK

- Node.js 22 o superior y npm.
- Android Studio reciente.
- JDK 21 o superior (el Android Gradle Plugin del proyecto compila Capacitor con Java 21).
- Android SDK Platform 36 y Android SDK Build-Tools instalados desde SDK Manager.

### Sincronizar y abrir en Android Studio

En Windows, abre una terminal PowerShell en el repositorio y ejecuta:

```powershell
Set-Location apps\web
npm ci
Copy-Item .env.example .env.local
# Completa .env.local con el número real y, opcionalmente, las claves públicas de Supabase.
Set-Location ..\mobile
npm ci
npm run mobile:sync
npm run android:open
```

`mobile:sync` compila la web desde `apps/web`, exporta a `apps/web/out/` y copia esa web al proyecto Android nativo de `apps/mobile`. En Android Studio, espera a que Gradle termine de sincronizar y selecciona **Build → Build Bundle(s) / APK(s) → Build APK(s)**. El APK de depuración se crea en:

```text
apps/mobile/android/app/build/outputs/apk/debug/iceclub-v2.apk
```

Para repetir el proceso completo con un comando en Windows, ejecuta `npm run android:apk` desde `apps/mobile`. El proyecto nativo usa la versión `2.0.1` (versionCode `3`); el zoom por pellizco se deshabilita en el WebView y el viewport, y la página no permite desplazamiento horizontal. La app carga el sitio y sus recursos desde el paquete; Google Maps, WhatsApp y Supabase requieren Internet para sus funciones.

Puedes instalarlo en un teléfono Android habilitando las instalaciones desde archivos y abriendo el APK. Para probar con USB, activa Depuración USB y usa `adb install -r apps/mobile/android/app/build/outputs/apk/debug/iceclub-v2.apk`.

### Actualizaciones de la app

La app incluye el sitio web dentro del APK. Publicar cambios en Vercel actualiza la web, pero no modifica las instalaciones ya hechas. Para avisos y actualizaciones sencillas, publica una versión firmada en Google Play; conserva el mismo identificador y la misma clave de firma, y aumenta `versionCode` en `apps/mobile/android/app/build.gradle` en cada versión. Play Store puede notificar a los usuarios y gestionar la instalación. Una distribución manual por APK necesita alojar cada APK firmado y agregar un comprobador de versiones; Android seguirá pidiendo al usuario que confirme la instalación. El APK de depuración no es una actualización de producción.

Para distribuir una versión de producción, usa **Build → Generate Signed Bundle / APK**. Crea y guarda la clave de firma en un lugar privado; **no la subas a GitHub ni la compartas por chat**. Para Google Play se debe generar un Android App Bundle (AAB), configurar la ficha de tienda y cumplir sus requisitos de privacidad y publicación.

La app usa el identificador provisional `pe.iceclub.app`. Antes de publicar o actualizar en tiendas, confirma el identificador definitivo: cambiarlo después crea una app Android diferente.

### Iconos y splash

El archivo fuente de marca es `apps/mobile/assets/icon.svg`. Ejecuta desde `apps/mobile` para regenerar los iconos Android:

```bash
npx @capacitor/assets generate --android --iconBackgroundColor "#021B33" --splashBackgroundColor "#021B33"
npm run mobile:sync
```

El icono de copo de hielo de `apps/mobile/assets/icon.svg` se usa para la app. Los iconos Android generados se guardan en `apps/mobile/android/app/src/main/res/`; los iconos web y el manifiesto están bajo `apps/web/public/`.

### Variables antes de la instalación

`NEXT_PUBLIC_WHATSAPP_NUMBER` debe ser el celular comercial con prefijo de país, sin `+` ni espacios. Si usarás Supabase, configura también URL y clave `anon`; nunca pongas una clave `service_role` en la app. Cada cambio a estas variables requiere volver a ejecutar `npm run mobile:sync` y recompilar el APK.

Para preparar la versión final también necesito el nombre e identificador Android definitivos, el número real de WhatsApp, precios/productos confirmados, y los textos/enlace de una política de privacidad y contacto comercial. Para Google Play, la cuenta de desarrollador, la clave de firma y los datos fiscales se configuran únicamente desde tus cuentas; no me envíes contraseñas ni claves privadas.
