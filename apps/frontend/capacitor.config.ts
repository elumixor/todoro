import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.todoro.app",
  appName: "Todoro",
  webDir: "build",
  server: {
    androidScheme: "https",
  },
};

export default config;
