// app/layout.jsx
import "../globals.css";

export default function RootLayout({ children }) {
  return (
      <html lang="en">
          <body>
            <main className="main-container bg-white">
              {children}
            </main>
          </body>
        </html>
        );
      }