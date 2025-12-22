import { Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import ClientLayout from "@/layout/clientLayout";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://ingobokainc.vercel.app"),

  title: {
    default: "Sisitemu yo gucunga farumasi | Ingoboka",
    template: "%s | Ingoboka"
  },

  description:
    "Ingoboka ni sisitemu ya farumasi ifasha gucunga imiti, kumenya igihe izarangirira, kugenzura ububiko no kwirinda igihombo mu buryo bworoshye.",

  keywords: [
    "sisitemu ya farumasi",
    "gucunga imiti",
    "igihe imiti izarangirira",
    "pharmacy management software Rwanda",
    "pharmacy inventory system",
    "drug expiry management system",
    "farumasi digital",
    "IngobokaInc",
    "Ingoboka Inc",
    "Ingoboka pharmacy system",
    "Ingoboka farumasi",
    "sisitemu ya farumasi"
  ],

  applicationName: "IngobokaInc",
  generator: "Next.js",
  category: "Business",
  authors: [{ name: "Ingoboka Inc" }],
  publisher: "Ingoboka Inc",

  openGraph: {
    title: "Sisitemu yo gucunga farumasi | IngobokaInc",
    description:
      "Gucunga imiti, igihe izarangirira n'ububiko bwa farumasi mu buryo bugezweho.",
    url: "https://ingobokainc.vercel.app",
    siteName: "IngobokaInc",
    locale: "rw_RW",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ingoboka Pharmacy Management Software",
        type: "image/png"
      }
    ]
  },

  twitter: {
    card: "summary_large_image",
    title: "Ingoboka – Sisitemu ya Farumasi",
    description:
      "Sisitemu ifasha farumasi gucunga imiti n'igihe izarangirira mu buryo bworoshye.",
    images: ["/og-image.png"],
    creator: "@IngobokaInc"
  },

  manifest: "/manifest.json",

  appleWebApp: {
    capable: true,
    title: "Ingoboka",
    statusBarStyle: "black-translucent"
  },

  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/apple-icon-57x57.png", sizes: "57x57", type: "image/png" },
      { url: "/apple-icon-60x60.png", sizes: "60x60", type: "image/png" },
      { url: "/apple-icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/apple-icon-76x76.png", sizes: "76x76", type: "image/png" },
      { url: "/apple-icon-114x114.png", sizes: "114x114", type: "image/png" },
      { url: "/apple-icon-120x120.png", sizes: "120x120", type: "image/png" },
      { url: "/apple-icon-144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/apple-icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/apple-icon-180x180.png", sizes: "180x180", type: "image/png" }
    ],
    shortcut: ["/favicon.ico"],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#1e7f5c"
      }
    ]
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
};

// Remove problematic viewport configuration and use standard approach
export const viewport = {
  themeColor: "#1e7f5c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="rw" className={`${poppins.variable} scroll-smooth`}>
      <head>
        {/* Simplified head - let Next.js handle metadata */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://ingobokainc.vercel.app" />
        
        {/* Structured Data / JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Ingoboka Pharmacy Management System",
              "description": "Pharmacy management software for Rwanda",
              "url": "https://ingobokainc.vercel.app",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "RWF"
              }
            })
          }}
        />
      </head>
      <body className="antialiased bg-white text-gray-900 min-h-screen font-sans">
        <ClientLayout>{children}</ClientLayout>
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              style: {
                background: '#10b981',
              },
            },
            error: {
              duration: 4000,
              style: {
                background: '#ef4444',
              },
            },
          }} 
        />
      </body>
    </html>
  );
}
