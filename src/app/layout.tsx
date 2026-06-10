import type { Metadata } from "next";
import localFont from "next/font/local"
import "./globals.css";

const vazir = localFont({
  src: [
    { path: "../../public/fonts/Vazir.woff2", weight: "400" },
    { path: "../../public/fonts/Vazir-Medium.woff2", weight: "500" },
    { path: "../../public/fonts/Vazir-Bold.woff2", weight: "700" },
    { path: "../../public/fonts/Vazir-Thin.woff2", weight: "200" },
    { path: "../../public/fonts/Vazir-Light.woff", weight: "300" }
  ],
  variable: "--font-vazir",
});

export const metadata: Metadata = {
  title: "دفترچه قرض",
  description: "اپلیکیشن مدیریت قرض و مطالبات",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html  className={`${vazir.variable} `}
      lang="en"
    >
      <body>{children}</body>
    </html>
  );
}
