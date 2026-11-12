# ICE CLUB — Marcianos gourmet artesanos

Landing responsive para ICE CLUB, con catálogo de sabores, puntos de entrega en la UNJFSC, carrito y confirmación de pedido por WhatsApp. Si Supabase no está configurado, la web usa los datos locales de `data/mock.ts`.

## Desarrollo

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

Abre `http://localhost:3000`. Para producción, ejecuta `npm run build` y luego `npm start`.

## Supabase

1. Crea un proyecto y ejecuta [`supabase/schema.sql`](./supabase/schema.sql) en el SQL Editor.
2. Copia las claves del proyecto a `.env.local`:

   ```env
   NEXT_PUBLIC_SITE_URL=https://tu-dominio.pe
   NEXT_PUBLIC_WHATSAPP_NUMBER=51999999999
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-publica
   ```

3. La landing lee productos y puntos de entrega, y crea pedidos pendientes. La política no habilita lecturas públicas de `orders`.
4. Sin ambas variables, se usan los datos mock de [`data/mock.ts`](./data/mock.ts).

Para agregar sabores o puntos, modifica el seed en `supabase/schema.sql` y los datos de respaldo en `data/mock.ts`. Usa rutas locales de `public/` para las imágenes.

## Modelo 3D

El directorio inicial no incluía un archivo 3D: únicamente había fotos bajo `fotos/`. Por eso no se generó un GLB, no se pueden enumerar los nombres reales de mallas/materiales ni verificar escala u orientación. La landing mantiene la imagen de producto como fallback y activa la escena WebGL cuando exista `public/models/ice-club.glb`. En una carga fallida, dispositivo de baja potencia o modo de movimiento reducido, conserva la imagen estática.

Cuando tengas el modelo:

1. Conserva el archivo original fuera de `public/` y copia una versión de trabajo sin sobrescribirlo.
2. Convierte el formato de origen a GLB con la herramienta correspondiente (por ejemplo, Blender en modo headless o `obj2gltf` para OBJ).
3. Instala la herramienta de optimización y revisa el modelo:

   ```bash
   npm install --no-save @gltf-transform/cli
   npx gltf-transform inspect .\modelo-original.glb
   ```

4. Optimiza texturas a 1024 px y aplica Draco:

   ```bash
   npx gltf-transform optimize .\modelo-original.glb .\public\models\ice-club.glb --texture-size 1024 --texture-compress webp --compress draco
   ```

5. Comprueba el tamaño y vuelve a inspeccionarlo. El objetivo es menos de 2 MB; la compresión final depende de la geometría y las texturas de origen.

La escena centra el modelo con su caja envolvente, lo escala a una altura visual uniforme y crea dos instancias inclinadas con tintes diferentes. La disponibilidad se detecta en el build, para que funcione también con los assets estáticos de Vercel; reinicia `npm run dev` al añadir o reemplazar el GLB. Si el GLB ya contiene la pareja, elimina la duplicación en `components/IceScene.tsx`. Si queda tumbado, ajusta la rotación inicial de cada grupo en ese archivo; si ocupa demasiado espacio, ajusta el factor `2.45 / maxAxis`.

## Assets y supuestos pendientes

- Se copiaron a `public/assets/` la foto del producto, una foto de marcianos, una composición con varios sabores y cristales de hielo. Los originales en `fotos/` no se modificaron.
- No se suministró un GLB, un mapa real del campus, cuentas sociales ni precios confirmados. Los precios de `data/mock.ts` son valores iniciales editables.
- Configura `NEXT_PUBLIC_WHATSAPP_NUMBER` con el número real (código de país, sin `+` ni espacios). Actualiza también el enlace de Instagram.
- La vista AR no aparece porque no se incluyó un GLB ni un visor `<model-viewer>`.
- Define `NEXT_PUBLIC_SITE_URL` con el dominio final y reemplaza `iceclub.example` en `app/robots.ts` y `app/sitemap.ts`.

## Publicar en GitHub y Vercel

Repositorio: [Cristian-code24/ICE-CLUB](https://github.com/Cristian-code24/ICE-CLUB).

1. En Vercel, selecciona **Add New → Project** e importa `Cristian-code24/ICE-CLUB`.
2. Deja el preset de Next.js y el comando de build predeterminado (`npm run build`).
3. Configura `NEXT_PUBLIC_SITE_URL` y `NEXT_PUBLIC_WHATSAPP_NUMBER`. Si usarás Supabase, agrega también `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Pulsa **Deploy**. Vercel vuelve a desplegar automáticamente los siguientes cambios de la rama `main`.

El workflow de GitHub Actions ejecuta ESLint y una compilación de producción en cada push a `main` y en cada pull request.
