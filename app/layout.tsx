import "../styles/globals.css";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body>
        <div style={{ padding: "20px", background: "#111" }}>
          <h2 style={{ color: "#a4d233" }}>SOLAR MITTE ENERGY OS</h2>
        </div>
        {children}
      </body>
    </html>
  );
}
