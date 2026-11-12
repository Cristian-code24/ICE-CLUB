"use client";

import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useEffect } from "react";

export default function NativeAppSetup() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const initializeNativeUI = async () => {
      try {
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setBackgroundColor({ color: "#021B33" });
        await StatusBar.setStyle({ style: Style.Light });
        await SplashScreen.hide();
      } catch (error) {
        console.error("No se pudo configurar la interfaz nativa:", error);
      }
    };

    void initializeNativeUI();
  }, []);

  return null;
}
