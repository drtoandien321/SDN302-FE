import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HeroUIProvider } from "@heroui/react";
import { IconContext } from "@phosphor-icons/react";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HeroUIProvider>
      <IconContext.Provider value={{ color: "currentColor", size: "1em", weight: "duotone" }}>
        <App />
      </IconContext.Provider>
    </HeroUIProvider>
  </StrictMode>
);
