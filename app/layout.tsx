import "./globals.css";

export const metadata = {
  title: "Travel Destination Assistant",
  description: "Simple chatbot connected to a CogitX workflow",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}