import React from "react";
import { AppProvider } from "./context/AppContext";
import "../App.css";
import "../index.css";
import "../views/PerformanceDashboard.css";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "نَسَق | منصة إدارة المخيمات والاستجابة الإنسانية",
    template: "%s | نَسَق",
  },
  description: "منصة مؤسسية آمنة لإدارة المخيمات، سجلات العائلات، الترشيحات الإغاثية والتقارير التشغيلية.",
  applicationName: "نَسَق",
  keywords: ["إدارة المخيمات", "الاستجابة الإنسانية", "إدارة الإغاثة", "سجلات العائلات"],
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
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
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
