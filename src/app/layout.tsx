import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import { getDictionary } from "@/lib/i18n/server";
import { CartProvider } from "@/components/cart-provider";
import { Footer } from "@/components/footer";
import { MotionProvider } from "@/components/motion-provider";
import { WhatsAppButton } from "@/components/whatsapp-button";
import "./globals.css";

// Cairo covers both Arabic and Latin, so the two languages look consistent.
const cairo = Cairo({ variable: "--font-cairo", subsets: ["arabic", "latin"] });

export const metadata: Metadata = {
  title: "M3akOrder معاك أوردر",
  description: "Order from nearby shops in Egypt, track your spending, and check what's worth it.",
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { locale, dir } = await getDictionary();
  return (
    <html lang={locale} dir={dir}>
      <body className={`${cairo.variable} flex min-h-dvh flex-col antialiased`}>
        <MotionProvider>
          <CartProvider>
            <div className="page-in flex flex-1 flex-col">{children}</div>
            <Footer />
            <WhatsAppButton />
          </CartProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
