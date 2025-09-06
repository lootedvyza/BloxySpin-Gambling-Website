import ReactDOM from "react-dom/client";
import React from "react";
import { MantineProvider } from "@mantine/core";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <MantineProvider withGlobalStyles withNormalizeCSS>
    <App />
  </MantineProvider>,
);
