import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import HomeIcon from "@/public/home.png";
import { IdleContextProvider } from "@/app/components/idle-detector";
import "./globals.css";
import ReactQueryProvider from "./react-query-provider";

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen min-w-screen grid grid-rows-[80px_1fr]`}
      >
        <div className="p-2 h-full">
          <Link href="/" className="flex content-center justify-start">
            <Image
              src={HomeIcon}
              width={64}
              height={64}
              alt="Home"
              className="block"
            />
            <h1 className="italic font-bold text-xl pt-5 ml-2">tasked</h1>
          </Link>
        </div>
        <IdleContextProvider>
          <ReactQueryProvider>{children}</ReactQueryProvider>
        </IdleContextProvider>
      </body>
    </html>
  );
}
