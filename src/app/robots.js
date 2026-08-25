export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nasaq.ps";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/contact", "/privacy", "/terms", "/features", "/faq"],
        disallow: ["/api/", "/super-admin/", "/families/", "/nominations/", "/settings/", "/print/"],
      },
      {
        userAgent: "Mediapartners-Google",
        allow: "/",
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/about", "/contact", "/privacy", "/terms", "/features", "/faq"],
        disallow: ["/api/", "/super-admin/", "/families/", "/nominations/", "/settings/", "/print/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
