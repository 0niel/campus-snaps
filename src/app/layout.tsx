import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";
import { SessionProvider } from "~/components/SessionProvider";
import SessionDebugger from "~/components/dev/SessionDebugger";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Campus Snaps",
  description: "Фото-платформа студенческого кампуса",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${GeistSans.variable}`}>
      <body>
        <TRPCReactProvider>
          <SessionProvider>
            {children}
            {/* Add session debugger in development */}
            {process.env.NODE_ENV === "development" && <SessionDebugger />}
          </SessionProvider>
        </TRPCReactProvider>
        {/* Service worker registration script */}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                  .then(registration => {
                    console.log('ServiceWorker registration successful:', registration.scope);
                  })
                  .catch(error => {
                    console.error('ServiceWorker registration failed:', error);
                  });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
