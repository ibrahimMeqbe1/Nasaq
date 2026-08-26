export default function manifest() {
  return {
    name: "نَسَق | منصة إدارة المخيمات والاستجابة الإنسانية",
    short_name: "نَسَق",
    description: "منصة مؤسسية سحابية وميدانية لإدارة سجلات العائلات والترشيحات الإغاثية.",
    start_url: "/families",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f8fafc",
    theme_color: "#064e3b",
    lang: "ar",
    dir: "rtl",
    icons: [
      {
        src: "/nasaq-logo.png",
        sizes: "192x192 512x512 1024x1024",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
    shortcuts: [
      {
        name: "سجلات العائلات",
        url: "/families",
        icons: [{ src: "/nasaq-logo.png", sizes: "192x192" }],
      },
      {
        name: "كشوفات الترشيح",
        url: "/nominations",
        icons: [{ src: "/nasaq-logo.png", sizes: "192x192" }],
      },
    ],
  };
}
