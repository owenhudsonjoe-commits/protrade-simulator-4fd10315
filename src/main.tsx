import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { seedSpecialAccountSync } from "./lib/specialAccount";

// Seed the special preview account before React mounts so that
// TradeContext / AuthContext read the populated localStorage on first render.
seedSpecialAccountSync();

createRoot(document.getElementById("root")!).render(<App />);
