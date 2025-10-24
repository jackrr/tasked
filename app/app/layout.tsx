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
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-w-screen`}
      >
        <div className="max-w-6xl m-auto grid grid-rows-[80px_1fr] h-screen">
          <div className="p-2 h-full">
            <Link href="/" className="flex items-center justify-start">
              <Image
                src={HomeIcon}
                width={64}
                height={64}
                alt="Home"
                className="block"
              />
              <h1 className="italic font-bold text-xl mt-2 ml-2">tasked</h1>
            </Link>
          </div>
          <IdleContextProvider>
            <ReactQueryProvider>{children}</ReactQueryProvider>
          </IdleContextProvider>
        </div>
      </body>
    </html>
  );
}
