import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://iceclub.example",
  ),
  title: "ICE CLUB | Marcianos gourmet artesanos",
  description:
    "Marcianos artesanales, heladitos y mucha frescura. Pide en tu facultad de la UNJFSC, Huacho.",
  openGraph: {
    title: "ICE CLUB | Marcianos gourmet artesanos",
    description: "Tu antojo helado, directo a tu salón en la UNJFSC.",
    images: ["/assets/ice-pop-pair.png"],
    locale: "es_PE",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-PE">
      <body className={`${inter.variable} ${poppins.variable}`}>{children}</body>
    </html>
  );
}
