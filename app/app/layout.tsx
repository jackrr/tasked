import { Geist, Geist_Mono } from "next/font/google";
import ReactQueryProvider from "./react-query-provider";
import Image from "next/image";
import HomeIcon from "@/public/home.png";

import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="p-2">
          <Link href="/">
            <Image src={HomeIcon} width={64} height={64} alt="Home" />
          </Link>
        </div>
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}
