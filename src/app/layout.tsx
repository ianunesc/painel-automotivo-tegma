import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DisclaimerModal from "@/components/DisclaimerModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Painel do Mercado Automotivo — Tegma RI",
  description:
    "Acompanhamento mensal do mercado automotivo brasileiro (veículos leves): licenciamento, produção, exportação, crédito, regiões e montadoras. Uma iniciativa do RI da Tegma (B3: TGMA3).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
        <Footer />
        <DisclaimerModal />
      </body>
    </html>
  );
}
