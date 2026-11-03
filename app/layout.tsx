import "./globals.css";

export const metadata = {
  title: "CogitX AI - Diwali Crossword & Greetings",
  description: "Diwali Crossword Puzzle and festive greetings from CogitX AI",
  icons: {
    icon: "/assets/cogitx-logo-clean.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>{children}</body>
    </html>
  );
}
