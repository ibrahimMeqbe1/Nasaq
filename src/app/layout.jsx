import React from "react";
import Script from "next/script";
import { AppProvider } from "./context/AppContext";
import "../App.css";
import "../index.css";
import "../views/PerformanceDashboard.css";
import "../publicPages.css";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "نَسَق | منصة إدارة المخيمات والاستجابة الإنسانية",
    template: "%s | نَسَق",
  },
  description: "منصة مؤسسية سحابية آمنة لإدارة المخيمات، سجلات العائلات والنازحين، الترشيحات الإغاثية والتقارير المعتمدة.",
  applicationName: "نَسَق",
  keywords: ["إدارة المخيمات", "الاستجابة الإنسانية", "إدارة الإغاثة", "سجلات العائلات", "كشوفات الترشيح", "نَسَق"],
  icons: {
    icon: "/nasaq-logo.png",
    apple: "/nasaq-logo.png",
  },
  openGraph: {
    title: "نَسَق | منصة إدارة المخيمات والاستجابة الإنسانية",
    description: "إدارة موثوقة للمخيمات والبيانات الإنسانية من منصة واحدة.",
    images: ["/nasaq-logo.png"],
    locale: "ar_PS",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&family=Tajawal:wght@300;400;500;700;800;900&display=swap" rel="stylesheet" />
        {adsenseClientId && (
          <Script
            id="google-adsense"
            strategy="lazyOnload"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
          />
        )}
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(reg) {
                      reg.update();
                      reg.onupdatefound = function() {
                        var installingWorker = reg.installing;
                        if (installingWorker) {
                          installingWorker.onstatechange = function() {
                            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                              window.location.reload();
                            }
                          };
                        }
                      };
                    },
                    function(err) {
                      console.warn('[Nasaq PWA] ServiceWorker registration warning:', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <div className="app-container" dir="rtl">
          <AppProvider>
            {children}
          </AppProvider>
        </div>
      </body>
    </html>
  );
}
