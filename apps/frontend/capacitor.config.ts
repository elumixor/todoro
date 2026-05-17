import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.eos.app",
  appName: "Eos",
  webDir: "build",
  server: {
    androidScheme: "https",
  },
};

export default config;
