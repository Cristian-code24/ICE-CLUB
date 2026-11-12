"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Instagram,
  MapPin,
  MessageCircle,
  Menu,
  Minus,
  Plus,
  ShoppingBag,
  Send,
  Snowflake,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import {
  deliveryPoints as mockDeliveryPoints,
  flavors as mockFlavors,
  type DeliveryPoint,
  type Flavor,
} from "@/data/mock";
import { useCart } from "@/lib/cart";
import { supabase } from "@/lib/supabase";

const IceModel3D = dynamic(() => import("@/components/IceModel3D"), {
  ssr: false,
});

export default function Home() {
  const [productList, setProductList] = useState(mockFlavors);
  const [pointList, setPointList] = useState(mockDeliveryPoints);
  const [selectedFlavorId, setSelectedFlavorId] = useState(mockFlavors[0].id);
  const [selectedDelivery, setSelectedDelivery] = useState(mockDeliveryPoints[0].id);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [query, setQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedAngle, setSelectedAngle] = useState("Frente");
  const [selected360Flavor, setSelected360Flavor] = useState(mockFlavors[0].id);
  const [heroModelReady, setHeroModelReady] = useState(false);
  const [model360Available, setModel360Available] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const { items, add, changeQuantity, remove, clear } = useCart();
  const whatsappNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "51999999999";

  const selectedFlavor =
    productList.find((flavor) => flavor.id === selectedFlavorId) ?? productList[0];
  const flavor360 =
    productList.find((flavor) => flavor.id === selected360Flavor) ?? productList[0];
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const filteredPoints = useMemo(
    () =>
      pointList.filter((point) =>
        point.name.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es")),
      ),
    [pointList, query],
  );

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let active = true;

    const loadCatalog = async () => {
      const [productsResult, pointsResult] = await Promise.all([
        client
          .from("products")
          .select("id,name,description,price,flavor_color,image_url")
          .eq("is_active", true)
          .order("sort_order"),
        client
          .from("delivery_points")
          .select("id,name,x_percent,y_percent,eta_minutes")
          .order("name"),
      ]);

      if (!active) return;
      if (productsResult.error) {
        console.error("No se pudo cargar el catálogo de Supabase:", productsResult.error);
        setNotice("Mostrando el menú local mientras vuelve el catálogo.");
      } else if (productsResult.data?.length) {
        const remoteFlavors: Flavor[] = productsResult.data.map((product) => ({
          id: product.id,
          name: product.name,
          subtitle: product.description,
          description: product.description,
          price: Number(product.price),
          color: product.flavor_color,
          image: product.image_url?.startsWith("/")
            ? product.image_url
            : mockFlavors.find((flavor) => flavor.id === product.id)?.image ??
              "/assets/ice-pops.jpg",
        }));
        setProductList(remoteFlavors);
        setSelectedFlavorId((current) =>
          remoteFlavors.some((flavor) => flavor.id === current)
            ? current
            : remoteFlavors[0].id,
        );
        setSelected360Flavor((current) =>
          remoteFlavors.some((flavor) => flavor.id === current)
            ? current
            : remoteFlavors[0].id,
        );
      }

      if (pointsResult.error) {
        console.error("No se pudieron cargar los puntos de Supabase:", pointsResult.error);
        setNotice("Mostrando los puntos locales mientras vuelve el mapa.");
      } else if (pointsResult.data?.length) {
        const remotePoints: DeliveryPoint[] = pointsResult.data.map((point) => ({
          id: point.id,
          name: point.name,
          x: Number(point.x_percent),
          y: Number(point.y_percent),
          eta: point.eta_minutes,
        }));
        setPointList(remotePoints);
        setSelectedDelivery((current) =>
          remotePoints.some((point) => point.id === current)
            ? current
            : remotePoints[0].id,
        );
      }
    };

    void loadCatalog().catch((error: unknown) => {
      console.error("No se pudieron cargar los datos de ICE CLUB:", error);
      if (active) setNotice("Mostrando los datos locales por ahora.");
    });
    return () => {
      active = false;
    };
  }, []);

  const addFlavor = (flavor: Flavor) => {
    add({ id: flavor.id, name: flavor.name, price: flavor.price });
    setNotice(`${flavor.name} se sumó a tu pedido`);
    window.setTimeout(() => setNotice(""), 2600);
  };

  useEffect(() => {
    if (!cartOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCartOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [cartOpen]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let removeListener: (() => void) | undefined;
    let cancelled = false;
    void App.addListener("backButton", ({ canGoBack }) => {
      if (cartOpen) {
        setCartOpen(false);
      } else if (mobileMenuOpen) {
        setMobileMenuOpen(false);
      } else if (canGoBack) {
        window.history.back();
      }
    })
      .then((listener) => {
        if (cancelled) {
          void listener.remove();
          return;
        }
        removeListener = () => {
          void listener.remove();
        };
      })
      .catch((error: unknown) => {
        console.error("No se pudo registrar el botón Atrás de Android:", error);
      });

    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, [cartOpen, mobileMenuOpen]);

  const openWhatsAppMessage = async (text: string) => {
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
    try {
      if (Capacitor.isNativePlatform()) {
        await Browser.open({ url });
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      console.error("No se pudo abrir WhatsApp:", error);
      setNotice("No pudimos abrir WhatsApp. Inténtalo otra vez.");
    }
  };

  const openGoogleMaps = async () => {
    const query = deliveryAddress.trim() || "UNJFSC, Huacho, Perú";
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    try {
      if (Capacitor.isNativePlatform()) {
        await Browser.open({ url });
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      console.error("No se pudo abrir Google Maps:", error);
      setNotice("No pudimos abrir Google Maps. Escribe la dirección manualmente.");
    }
  };

  const placeOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!items.length) return;
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const customerName = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const address = String(formData.get("address") ?? "").trim();
    const isNative = Capacitor.isNativePlatform();
    const whatsappTab = isNative ? null : window.open("", "_blank");
    if (whatsappTab) whatsappTab.opener = null;
    const deliveryPoint = pointList.find(
      (point) => point.id === selectedDelivery,
    );

    if (supabase) {
      const { error } = await supabase.from("orders").insert({
        customer_name: customerName,
        phone,
        delivery_point_id: selectedDelivery,
        delivery_address: address,
        items,
        total: subtotal,
        status: "pending",
      });
      if (error) {
        whatsappTab?.close();
        setNotice("No pudimos registrar tu pedido. Inténtalo otra vez.");
        setSubmitting(false);
        return;
      }
    }

    const orderLines = items
      .map((item) => `• ${item.quantity}x ${item.name} — S/ ${(item.price * item.quantity).toFixed(2)}`)
      .join("\n");
    const message = [
      `¡Hola, ICE CLUB! Soy ${customerName}.`,
      orderLines,
      `Total: S/ ${subtotal.toFixed(2)}`,
      `Teléfono: ${phone}`,
      `Dirección de entrega: ${address}`,
      `Punto de referencia: ${deliveryPoint?.name ?? "Campus"}`,
    ].join("\n");
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    try {
      if (isNative) {
        await Browser.open({ url: whatsappUrl });
      } else if (whatsappTab) {
        whatsappTab.location.href = whatsappUrl;
      } else {
        window.location.assign(whatsappUrl);
      }
    } catch (error) {
      console.error("No se pudo abrir WhatsApp para confirmar el pedido:", error);
      whatsappTab?.close();
      setNotice("No pudimos abrir WhatsApp. Tu carrito sigue guardado.");
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    clear();
    setDeliveryAddress("");
    setCartOpen(false);
  };

  const sendContactMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("contact-name") ?? "").trim();
    const faculty = String(formData.get("faculty") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();
    const text = `¡Hola, ICE CLUB! Soy ${name} de ${faculty}. ${message}`;
    void openWhatsAppMessage(text);
  };

  const scrollVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 22 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "IceCreamShop",
            name: "ICE CLUB — Marcianos gourmet artesanos",
            description:
              "Marcianos artesanales entregados en la UNJFSC, Huacho, Perú.",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Huacho",
              addressRegion: "Lima",
              addressCountry: "PE",
            },
            servesCuisine: "Helados artesanales",
            priceRange: "S/ 4–5",
          }).replace(/</g, "\\u003c"),
        }}
      />
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ice-shape ice-shape-left" aria-hidden="true">
        <Image src="/assets/ice-cubes.png" alt="" fill sizes="240px" />
      </div>
      <div className="ice-shape ice-shape-right" aria-hidden="true">
        <Image src="/assets/ice-cubes.png" alt="" fill sizes="240px" />
      </div>

      <header className="site-header glass">
        <a className="brand" href="#inicio" aria-label="ICE CLUB, ir al inicio">
          <span className="brand-mark"><Snowflake size={20} /></span>
          <span>
            <strong>ICE CLUB</strong>
            <small>MARCIANOS GOURMET ARTESANOS</small>
          </span>
        </a>
        <nav className="desktop-nav" aria-label="Navegación principal">
          <a href="#sabores">Sabores</a>
          <a href="#campus">Puntos de entrega</a>
          <a href="#nosotros">Nuestra onda</a>
        </nav>
        <div className="header-actions">
          <button
            className="cart-button glass"
            onClick={() => setCartOpen(true)}
            aria-label={`Abrir carrito, ${items.reduce((count, item) => count + item.quantity, 0)} productos`}
          >
            <ShoppingBag size={18} />
            <span>Mi pedido</span>
            <b>{items.reduce((count, item) => count + item.quantity, 0)}</b>
          </button>
          <button
            className="mobile-menu-button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              className="mobile-nav glass"
              aria-label="Navegación móvil"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {[
                ["Sabores", "#sabores"],
                ["Puntos de entrega", "#campus"],
                ["Nuestra onda", "#nosotros"],
              ].map(([label, href]) => (
                <a key={href} href={href} onClick={() => setMobileMenuOpen(false)}>
                  {label}<ArrowRight size={16} />
                </a>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <section className="hero page-width" id="inicio">
        <div className="hero-copy">
          <motion.div
            className="eyebrow"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <span className="status-dot" /> HECHOS EN HUACHO, PARA TU RECREO
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, delay: 0.18 }}
          >
            EL ANTOJO
            <br />
            <span className="headline-gradient">MÁS CÓSMICO</span>
            <br />
            DEL CAMPUS.
          </motion.h1>
          <motion.p
            className="hero-description"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38, duration: 0.55 }}
          >
            Marcianos artesanales que aterrizan directo en tu facultad. Un
            recreo más rico empieza aquí.
          </motion.p>
          <motion.div
            className="hero-buttons"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <a className="button-primary" href="#sabores">
              Elegir mi sabor <ArrowRight size={17} />
            </a>
            <a className="button-quiet" href="#campus">
              <MapPin size={16} /> Estamos en la UNJFSC
            </a>
          </motion.div>
          <div className="hero-proof">
            <div className="avatar-stack" aria-hidden="true">
              <span>🍓</span><span>🥭</span><span>🍦</span>
            </div>
            <p><strong>Un recreo, un marciano.</strong><br />Elaborados en pequeños lotes.</p>
          </div>
        </div>

        <motion.div
          className={`hero-art ${heroModelReady ? "hero-model-ready" : ""}`}
          initial={{ opacity: 0, scale: 0.9, rotate: -4 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.9, delay: 0.25 }}
        >
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="hero-glow" />
          <div className="hero-image-fallback">
            <Image
              src="/assets/ice-pop-pair.png"
              alt="Marcianos artesanales de varios sabores sobre hielo"
              fill
              priority
              sizes="(max-width: 760px) 90vw, 45vw"
            />
          </div>
          <Suspense fallback={null}>
            <IceModel3D
              flavorName={selectedFlavor.name}
              flavorColor={selectedFlavor.color}
              onModelReady={() => setHeroModelReady(true)}
            />
          </Suspense>
          <motion.div
            className="product-pill glass"
            animate={prefersReducedMotion ? undefined : { y: [0, -6, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="pill-icon"><Sparkles size={16} /></span>
            <span><small>EL FAVORITO</small><strong>{selectedFlavor.name}</strong></span>
            <span className="pill-price">S/ {selectedFlavor.price.toFixed(2)}</span>
          </motion.div>
          <span className="floating-note note-top"><Snowflake size={14} /> 100% artesanal</span>
          <span className="floating-note note-bottom">frío, rico & local <span>✦</span></span>
        </motion.div>

        <div className="hero-side-note">
          <span>01 / 03</span><i /><span>ELIGE · PIDE · DISFRUTA</span>
        </div>
        <a className="scroll-cue" href="#sabores"><ArrowDown size={15} /> DESCUBRE EL MENÚ</a>
      </section>

      <section className="flavor-strip page-width" id="sabores">
        <div className="section-intro">
          <span className="eyebrow"><span className="section-index">01</span> LA VITRINA</span>
          <h2>¿Qué sabor te <em>llama?</em></h2>
          <p>Un clásico de siempre o tu nueva obsesión.</p>
        </div>
        <div className="flavor-grid">
          {productList.map((flavor, index) => {
            const active = selectedFlavorId === flavor.id;
            return (
              <motion.button
                key={flavor.id}
                className={`flavor-card glass ${active ? "flavor-active" : ""}`}
                style={{ "--flavor-color": flavor.color } as React.CSSProperties}
                onClick={() => setSelectedFlavorId(flavor.id)}
                whileHover={prefersReducedMotion ? undefined : { y: -5 }}
                whileTap={{ scale: 0.98 }}
                aria-pressed={active}
                aria-label={`Elegir ${flavor.name}, S/ ${flavor.price}`}
              >
                <span className="flavor-number">0{index + 1}</span>
                <span className="flavor-swatch"><span /></span>
                <span className="flavor-content">
                  <strong>{flavor.name}</strong>
                  <small>{flavor.subtitle}</small>
                </span>
                <span className="flavor-price">S/ {flavor.price.toFixed(2)}</span>
                {active && <span className="flavor-check"><Check size={13} /></span>}
              </motion.button>
            );
          })}
        </div>
      </section>

      <section className="featured page-width">
        <motion.div
          className="featured-visual"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={scrollVariants}
        >
          <Image
            src={selectedFlavor.image}
            alt={`Marcianos artesanales para disfrutar ${selectedFlavor.name}`}
            fill
            sizes="(max-width: 760px) 90vw, 44vw"
            className="featured-image"
          />
          <div className="featured-label glass">
            <span className="label-dot" style={{ background: selectedFlavor.color }} />
            <span>HECHO CON CARIÑO EN HUACHO</span>
          </div>
        </motion.div>
        <motion.div
          className="featured-copy"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={scrollVariants}
        >
          <span className="eyebrow"><span className="section-index">02</span> EL PROTAGONISTA</span>
          <h2>Un pequeño<br /><em>gran momento.</em></h2>
          <p>
            Hechos a mano, con ingredientes que sí conoces y ese saborcito que
            convierte cualquier pausa entre clases en tu parte favorita del día.
          </p>
          <div className="feature-stats">
            <div><strong>100%</strong><span>hecho a mano</span></div>
            <div><strong>5</strong><span>sabores para explorar</span></div>
            <div><strong>0</strong><span>ganas de compartir 😌</span></div>
          </div>
          <button className="text-link" onClick={() => addFlavor(selectedFlavor)}>
            Agregar {selectedFlavor.name} <ArrowUpRight size={17} />
          </button>
        </motion.div>
      </section>

      <section className="menu-section" id="menu">
        <div className="page-width">
          <div className="menu-heading">
            <div>
              <span className="eyebrow"><span className="section-index">03</span> MENÚ DE LA NAVE</span>
              <h2>Tu próximo <em>favorito.</em></h2>
            </div>
            <span className="menu-meta">PEQUEÑOS LOTES · GRANDES ANTOJOS</span>
          </div>
          <div className="product-grid">
            {productList.map((flavor, index) => (
              <motion.article
                className="product-card glass"
                key={flavor.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={scrollVariants}
                transition={{ delay: index * 0.08 }}
              >
                <div className="product-image">
                  <Image src={flavor.image} alt={flavor.name} fill sizes="(max-width: 760px) 90vw, 30vw" />
                  <span className="product-badge">{index === 0 ? "MÁS PEDIDO" : "ARTESANAL"}</span>
                </div>
                <div className="product-info">
                  <div><h3>{flavor.name}</h3><span>{flavor.subtitle}</span></div>
                  <b>S/ {flavor.price.toFixed(2)}</b>
                </div>
                <p>{flavor.description}</p>
                <button className="add-product" onClick={() => addFlavor(flavor)}>
                  Añadir al pedido <Plus size={16} />
                </button>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="campus-section page-width" id="campus">
        <div className="campus-copy">
          <span className="eyebrow"><span className="section-index">04</span> ENTREGA EN CAMPUS</span>
          <h2>Tu salón es<br />nuestro <em>destino.</em></h2>
          <p>Elige tu punto y te encontramos. Coordinamos por WhatsApp para que tu marciano llegue en el mejor momento.</p>
          <label className="campus-search glass">
            <MapPin size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Busca tu facultad..."
              aria-label="Buscar punto de entrega"
            />
            <ChevronDown size={16} />
          </label>
          <div className="point-list">
            {filteredPoints.length ? filteredPoints.map((point) => (
              <button
                key={point.id}
                onClick={() => setSelectedDelivery(point.id)}
                className={`point-row ${selectedDelivery === point.id ? "point-selected" : ""}`}
                aria-pressed={selectedDelivery === point.id}
              >
                <span className="point-pin"><MapPin size={15} /></span>
                <span><strong>{point.name}</strong><small>Entrega aproximada</small></span>
                <span className="point-eta"><Clock3 size={13} /> {point.eta} min</span>
              </button>
            )) : <p className="empty-search">No encontramos esa facultad.</p>}
          </div>
        </div>
        <div className="campus-map glass" aria-label="Mapa ilustrado de puntos de entrega de la UNJFSC">
          <div className="map-topline"><span><i /> CAMPUS UNJFSC · HUACHO</span><span>LIVE</span></div>
          <div className="map-grid-lines" />
          <div className="map-road road-one" />
          <div className="map-road road-two" />
          <div className="map-road road-three" />
          <div className="map-lawn lawn-one" />
          <div className="map-lawn lawn-two" />
          {pointList.map((point) => (
            <button
              key={point.id}
              className={`map-pin ${selectedDelivery === point.id ? "map-pin-active" : ""}`}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              onClick={() => setSelectedDelivery(point.id)}
              aria-label={`${point.name}, entrega aproximada ${point.eta} minutos`}
              aria-pressed={selectedDelivery === point.id}
            >
              <span className="pin-wave" /><MapPin size={17} />
              {selectedDelivery === point.id && <span className="pin-label glass">{point.name} · {point.eta} min</span>}
            </button>
          ))}
          <span className="map-compass">N<br /><ArrowUpRight size={13} /></span>
          <div className="map-caption glass"><span className="map-caption-icon"><Snowflake size={18} /></span><span><b>Nos vemos por ahí.</b><small>Encuentro en tu facultad</small></span><ArrowRight size={15} /></div>
        </div>
      </section>

      <section className="how-section page-width" id="nosotros">
        <div className="how-header">
          <span className="eyebrow"><span className="section-index">05</span> MISIÓN: RECREO FELIZ</span>
          <h2>Del antojo a tu mano<br />en <em>tres pasos.</em></h2>
        </div>
        <div className="steps-grid">
          {[
            { n: "01", icon: <Sparkles />, title: "Elige tu sabor", body: "Hay un marciano esperándote. ¿Frutal, cremosito o ambos?" },
            { n: "02", icon: <MapPin />, title: "Marca tu facultad", body: "Dinos dónde estás y coordinamos el punto de encuentro." },
            { n: "03", icon: <Snowflake />, title: "Disfruta el recreo", body: "Recibe tu pedido bien frío y date ese gustito." },
          ].map((step) => (
            <motion.article
              className="step-card"
              key={step.n}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={scrollVariants}
            >
              <span className="step-number">{step.n}</span>
              <span className="step-icon">{step.icon}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
              <span className="step-line" />
            </motion.article>
          ))}
        </div>
      </section>

      <section className="showcase-section page-width" id="vista-360">
        <div className="showcase-panel glass">
          <div className="showcase-copy">
            <span className="eyebrow"><span className="section-index">06</span> CONOCE A TU MARCIANO</span>
            <h2>Míralo en<br /><em>360°.</em></h2>
            <p>Gíralo, explóralo y elige tu sabor favorito. Cada uno tiene su propia personalidad.</p>
            <div className="showcase-controls">
              <span className="control-label">SABOR</span>
              <div className="control-pills">
                {productList.map((flavor) => (
                  <button
                    key={flavor.id}
                    className={selected360Flavor === flavor.id ? "control-pill control-pill-active" : "control-pill"}
                    onClick={() => setSelected360Flavor(flavor.id)}
                  >{flavor.name.split(" ")[0]}</button>
                ))}
              </div>
              <span className="control-label">ÁNGULO</span>
              <div className="control-pills">
                {["Frente", "Espalda", "Detalle"].map((angle) => (
                  <button
                    key={angle}
                    className={selectedAngle === angle ? "control-pill control-pill-active" : "control-pill"}
                    onClick={() => setSelectedAngle(angle)}
                  >{angle}</button>
                ))}
              </div>
            </div>
            <span className="drag-hint"><ChevronLeft size={14} /> ARRASTRA PARA GIRAR <ChevronRight size={14} /></span>
          </div>
          <div className="showcase-model">
            <Suspense fallback={null}>
              <IceModel3D
                flavorName={flavor360.name}
                flavorColor={flavor360.color}
                showControls
                viewAngle={selectedAngle}
                onAvailabilityChange={setModel360Available}
              />
            </Suspense>
            <div className="showcase-ring" />
          </div>
          <span className="showcase-index">ICE CLUB · 001</span>
        </div>
        {!model360Available && (
          <div className="ar-note"><span className="ar-dot" /> La vista 3D interactiva estará disponible al añadir el modelo GLB del producto.</div>
        )}
      </section>

      <section className="help-section page-width" id="contacto">
        <div className="faq-column">
          <span className="eyebrow"><span className="section-index">07</span> PREGUNTAS DE LA TRIPULACIÓN</span>
          <h2>Resolvemos<br /><em>tu curiosidad.</em></h2>
          <div className="faq-list">
            {[
              {
                question: "¿Dónde hacen las entregas?",
                answer: "Coordinamos puntos de encuentro dentro del campus UNJFSC. Elige tu facultad en el mapa y afinamos los detalles por WhatsApp.",
              },
              {
                question: "¿Cómo hago mi pedido?",
                answer: "Agrega tus sabores al carrito, completa tus datos y confirma. Te llevamos a WhatsApp con el resumen para coordinar.",
              },
              {
                question: "¿Qué medios de pago aceptan?",
                answer: "Aceptamos Yape, Plin o efectivo. Coordinamos el pago por WhatsApp al confirmar tu pedido.",
              },
              {
                question: "¿Cuánto demora la entrega?",
                answer: "El tiempo que ves en el mapa es una referencia. Confirmamos la hora y el punto exactos contigo por WhatsApp.",
              },
            ].map((faq, index) => (
              <div className={`faq-item ${openFaq === index ? "faq-item-open" : ""}`} key={faq.question}>
                <button
                  className="faq-question"
                  aria-expanded={openFaq === index}
                  onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                >
                  <span>{faq.question}</span>
                  <Plus size={16} />
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === index && (
                    <motion.p
                      className="faq-answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      {faq.answer}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
        <div className="contact-card glass">
          <span className="contact-icon"><MessageCircle size={20} /></span>
          <span className="eyebrow">HABLEMOS POR WHATSAPP</span>
          <h3>¿Tienes una<br /><em>misión especial?</em></h3>
          <p>Cuéntanos qué necesitas y coordinamos contigo. También puedes dejarnos una sugerencia de sabor.</p>
          <form className="contact-form" onSubmit={sendContactMessage}>
            <label>Tu nombre<input name="contact-name" required placeholder="Nombre" /></label>
            <label>Tu facultad
              <select
                name="faculty"
                defaultValue={
                  pointList.find((point) => point.id === selectedDelivery)?.name ??
                  pointList[0]?.name
                }
              >
                {pointList.map((point) => <option key={point.id} value={point.name}>{point.name}</option>)}
              </select>
            </label>
            <label>¿En qué te ayudamos?<textarea name="message" rows={3} required placeholder="Escribe tu mensaje..." /></label>
            <button className="button-primary" type="submit">Enviar mensaje <Send size={15} /></button>
          </form>
          <span className="contact-footnote">Al enviar, se abrirá WhatsApp para continuar la conversación.</span>
        </div>
      </section>

      <section className="last-call page-width">
        <div className="last-call-card">
          <div className="last-call-glow" />
          <span className="eyebrow"><span className="status-dot" /> TU PRÓXIMO RECREO</span>
          <h2>Un marciano<br />te está <em>esperando.</em></h2>
          <p>Elige el sabor. Nosotros ponemos el frío.</p>
          <a className="button-primary" href="#sabores">Armar mi pedido <ArrowRight size={17} /></a>
          <div className="last-call-art"><Image src="/assets/ice-cubes.png" alt="" fill sizes="250px" /></div>
        </div>
      </section>

      <section className="terms-section page-width" id="terminos" aria-labelledby="terms-title">
        <div className="terms-card glass">
          <span className="eyebrow"><span className="section-index">08</span> COMPRA TRANSPARENTE</span>
          <h2 id="terms-title">Términos y condiciones</h2>
          <ul>
            <li>No necesitas crear una cuenta. El pedido se confirma cuando ICE CLUB lo coordina contigo por WhatsApp.</li>
            <li>Los precios y la disponibilidad se confirman antes de preparar el pedido. La entrega depende de la cobertura y del punto acordado.</li>
            <li>Usamos tu nombre, celular, dirección y pedido para coordinar la entrega. Al confirmar, el resumen se comparte con ICE CLUB por WhatsApp; si la base de datos está habilitada, también se registra allí.</li>
            <li>Revisa la dirección, cantidades y total en WhatsApp antes de enviar el mensaje.</li>
          </ul>
        </div>
      </section>

      <footer className="site-footer page-width">
        <a className="brand" href="#inicio">
          <span className="brand-mark"><Snowflake size={20} /></span>
          <span><strong>ICE CLUB</strong><small>Marcianos gourmet artesanos</small></span>
        </a>
        <p>Frío, rico y hecho con cariño en Huacho.<br />© {new Date().getFullYear()} ICE CLUB.</p>
        <a className="social-link" href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram de ICE CLUB">
          <Instagram size={17} /> Síguenos <ArrowUpRight size={14} />
        </a>
        <a className="terms-link" href="#terminos">Términos y condiciones</a>
      </footer>

      <AnimatePresence>
        {cartOpen && (
          <motion.div className="drawer-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCartOpen(false)}>
            <motion.aside
              className="cart-drawer glass"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="cart-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="drawer-header">
                <div><span className="eyebrow">TU PEDIDO</span><h2 id="cart-title">Carrito <em>cósmico.</em></h2></div>
                <button className="icon-button" onClick={() => setCartOpen(false)} aria-label="Cerrar carrito"><X /></button>
              </div>
              {items.length ? (
                <>
                  <div className="cart-items">
                    {items.map((item) => (
                      <div className="cart-item" key={item.id}>
                        <div className="cart-item-mark"><Snowflake size={19} /></div>
                        <div className="cart-item-main"><strong>{item.name}</strong><small>S/ {item.price.toFixed(2)} c/u</small>
                          <div className="quantity-control">
                            <button onClick={() => changeQuantity(item.id, -1)} aria-label={`Quitar uno de ${item.name}`}><Minus size={13} /></button>
                            <span>{item.quantity}</span>
                            <button onClick={() => changeQuantity(item.id, 1)} aria-label={`Añadir uno de ${item.name}`}><Plus size={13} /></button>
                          </div>
                        </div>
                        <strong className="cart-line-price">S/ {(item.price * item.quantity).toFixed(2)}</strong>
                        <button className="remove-item" onClick={() => remove(item.id)} aria-label={`Eliminar ${item.name}`}><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                  <form className="checkout-form" onSubmit={placeOrder}>
                    <label>Nombre<input name="name" autoComplete="name" required maxLength={100} placeholder="¿Cómo te llamas?" /></label>
                    <label>Celular<input name="phone" type="tel" autoComplete="tel" inputMode="tel" required maxLength={24} placeholder="999 999 999" /></label>
                    <label>Dirección de entrega
                      <input
                        name="address"
                        autoComplete="street-address"
                        required
                        maxLength={300}
                        placeholder="Calle, referencia o enlace de Maps"
                        value={deliveryAddress}
                        onChange={(event) => setDeliveryAddress(event.target.value)}
                      />
                    </label>
                    <button className="maps-action" type="button" onClick={() => void openGoogleMaps()}>
                      <MapPin size={14} /> Buscar dirección en Google Maps
                    </button>
                    <p className="maps-hint">Busca el lugar y escribe o pega aquí la dirección exacta.</p>
                    <div className="cart-total"><span>Total</span><strong>S/ {subtotal.toFixed(2)}</strong></div>
                    <button className="button-primary checkout-button" disabled={submitting}>
                      {submitting ? "Preparando..." : "Confirmar por WhatsApp"} <ArrowRight size={16} />
                    </button>
                  </form>
                </>
              ) : (
                <div className="empty-cart"><span><ShoppingBag size={26} /></span><h3>Tu nave va vacía.</h3><p>Elige un sabor y nosotros lo preparamos bien frío.</p><button className="button-primary" onClick={() => setCartOpen(false)}>Ver sabores <ArrowRight size={15} /></button></div>
              )}
              <p className="cart-footnote">Al confirmar, coordinamos tu entrega por WhatsApp.</p>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {notice && <motion.div className="toast glass" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}><Check size={16} /> {notice}</motion.div>}
      </AnimatePresence>
    </main>
  );
}
