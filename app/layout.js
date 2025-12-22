// app/layout.js
import { Poppins } from "next/font/google";
import "./globals.css";
import ClientLayoutWrapper from "./components/ClientLayoutWrapper";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://ingobokainc.vercel.app"),
  title: { default: "Sisitemu yo gucunga farumasi | Ingoboka", template: "%s | IngobokaInc" },
  description: "Ingoboka ni sisitemu ya farumasi ifasha gucunga imiti no kugenzura ububiko.",
  keywords: [
    "pharmacy management",
    "farumasi",
    "IngobokaInc",
    "drug expiry management",
  ],
  applicationName: "IngobokaInc",
  generator: "Next.js",
  category: "Business",
  openGraph: {
    title: "Sisitemu yo gucunga farumasi | IngobokaInc",
    description: "Gucunga imiti, igihe izarangirira n'ububiko bwa farumasi mu buryo bugezweho.",
    url: "https://ingobokainc.vercel.app",
    siteName: "IngobokaInc",
    locale: "rw_RW",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Ingoboka Software" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ingoboka – Sisitemu ya Farumasi",
    description: "Sisitemu ifasha farumasi gucunga imiti n'igihe izarangirira mu buryo bworoshye.",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Ingoboka", statusBarStyle: "black-translucent" },
  icons: { icon: "/favicon.ico", apple: "/apple-icon.png" },
  robots: { index: true, follow: true },
  other: [
    { name: "google-site-verification", content: "0R26gDoOtNCnmjLMaIZ87eu1VIZiw1C-g7GBG_L7zxU" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="rw" className={poppins.variable}>
      <body className="antialiased bg-white text-gray-900">
        <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
      </body>
    </html>
  );
}
