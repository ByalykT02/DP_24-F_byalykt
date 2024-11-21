import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import Header from "~/components/common/header";
import Footer from "~/components/common/footer";

export const metadata: Metadata = {
  title: "GalleryGlobe",
  description:
    "Discover and collect extraordinary artworks from around the world",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body>
          <Header />
          <main>{children}</main>
          <Footer />
      </body>
    </html>
  );
}
