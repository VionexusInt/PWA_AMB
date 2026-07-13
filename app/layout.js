import "./globals.css";
import RegistrarSW from "../components/RegistrarSW";
import GateAcceso from "../components/GateAcceso";

export const metadata = {
  title: "Control · Ambulancias",
  description: "Control de trabajadores, ambulancias y bases",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Control" },
};

export const viewport = {
  themeColor: "#0d1117",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Semi+Condensed:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="font-sans min-h-screen">
        <GateAcceso>{children}</GateAcceso>
        <RegistrarSW />
      </body>
    </html>
  );
}