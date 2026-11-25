import type { Metadata, Viewport } from "next";
import { Overpass } from "next/font/google";
import "./globals.css";

// Overpass: shared with Stride, so the two apps read as one family.
const overpass = Overpass({
  variable: "--font-overpass",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
});

export const metadata: Metadata = {
  title: "Takeaway",
  description: "Turn the videos and links you save into notes you can review.",
};

export const viewport: Viewport = {
  themeColor: "#3436A8",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${overpass.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
