import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { networkInterfaces } from "os";
import { defineConfig } from "vite";

function getLocalIP() {
  for (const iface of Object.values(networkInterfaces()).flat()) {
    if (iface?.family === "IPv4" && !iface.internal) return iface.address;
  }
  return "localhost";
}

const localIP = getLocalIP();
const apiPort = 10000;

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server: { port: 3000 },
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify(process.env.VITE_API_URL ?? `http://${localIP}:${apiPort}`),
  },
});
