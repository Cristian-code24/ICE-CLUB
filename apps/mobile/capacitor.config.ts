import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "pe.iceclub.app",
  appName: "ICE CLUB",
  webDir: "../web/out",
  server: {
    androidScheme: "https",
  },
  backgroundColor: "#021B33",
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: "#021B33",
      androidScaleType: "CENTER_INSIDE",
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: false,
      backgroundColor: "#021B33",
      style: "LIGHT",
    },
  },
};

export default config;
