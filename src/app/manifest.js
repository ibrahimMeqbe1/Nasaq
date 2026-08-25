export default function manifest() {
  return {
    name: "نَسَق | منصة إدارة المخيمات والاستجابة الإنسانية",
    short_name: "نَسَق",
    description: "منصة مؤسسية آمنة لإدارة المخيمات والعمليات الإنسانية.",
    start_url: "/login",
    display: "standalone",
    background_color: "#f7f5ef",
    theme_color: "#0f5132",
    lang: "ar",
    dir: "rtl",
    icons: [
      { src: "/nasaq-logo.png", sizes: "1024x1024", type: "image/png", purpose: "any" },
    ],
  };
}
