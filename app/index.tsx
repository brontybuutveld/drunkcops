import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from "react-router-dom";

import Home from "./routes/home";
import Setup from "./routes/setup";
import Edit from "./routes/edit";
import CustomGame from "./routes/customGame";
import { Layout } from "./root";

const root = ReactDOM.createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="setup" element={<Setup />} />
        <Route path="edit/:gameConfig" element={<EditWrapper />} />
        <Route path="customGame/:gameConfig" element={<CustomGameWrapper />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);


// root.render(
//   <React.StrictMode>
//     <RouterProvider router={router} />
//   </React.StrictMode>
// );

// Wrappers to extract params
import { useParams } from "react-router-dom";

function EditWrapper() {
  const { gameConfig } = useParams<{ gameConfig: string }>();
  console.log(gameConfig)
  if (!gameConfig) return null;
  return <Edit gameConfigParam={gameConfig} />;
}

function CustomGameWrapper() {
  const { gameConfig } = useParams<{ gameConfig: string }>();
  if (!gameConfig) return null;
  return <CustomGame gameConfigParam={gameConfig} />;
}