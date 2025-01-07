import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import Header from "~/components/common/header";
import Footer from "~/components/common/footer";
import { SessionProvider } from "next-auth/react";
import { auth } from "auth";
import { Toaster } from "~/components/ui/toaster";

export const metadata: Metadata = {
  title: "GalleryGlobe",
  description:
    "Discover and collect extraordinary artworks from around the world",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <SessionProvider session={session}>
      <html lang="en" className={`${GeistSans.variable}`}>
        <body>
          <Header />
          <main>{children}</main>
          <Toaster />
          <Footer />
        </body>
      </html>
    </SessionProvider>
  );
}
