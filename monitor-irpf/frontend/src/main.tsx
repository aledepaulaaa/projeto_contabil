import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/global.css";
import "./styles/restituicao.css";
import "./styles/lista-filtros.css";
import "./styles/diagnostico-fiscal.css";
import "./styles/documentos.css";

const el = document.getElementById("root");
if (!el) throw new Error("root missing");

createRoot(el).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
