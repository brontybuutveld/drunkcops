// root.tsx
import React from "react";

import "./app.css";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-container">
      {children}
    </div>
  );
}

export default function App() {
  return <div>App</div>; // Not strictly needed if Layout wraps everything
}

export function ErrorBoundary({ error }: { error: unknown }) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}