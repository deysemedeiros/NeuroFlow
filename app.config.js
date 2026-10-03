/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  name: "NeuroFlow",
  slug: "neuroflow",
  version: "1.1.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "neuroflow",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  splash: {
    image: "./assets/images/icon.png",
    resizeMode: "contain",
    backgroundColor: "#F4F1FA",
  },
  ios: {
    bundleIdentifier: "com.neuroflow.app",
    buildNumber: "1",
    supportsTablet: false,
  },
  android: {
    package: "com.neuroflow.app",
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: "./assets/images/icon.png",
      backgroundColor: "#F4F1FA",
    },
  },
  web: {
    // "single" gera um SPA (um index.html) — ideal para Vercel/Netlify.
    output: "single",
    bundler: "metro",
    favicon: "./assets/images/icon.png",
    name: "NeuroFlow",
    shortName: "NeuroFlow",
    description: "Plataforma de apoio a pessoas com TDAH: diário emocional, metas, respiração guiada e profissionais.",
    themeColor: "#B4A3D9",
    backgroundColor: "#F4F1FA",
    lang: "pt-BR",
  },
  plugins: ["expo-router", "expo-font", "expo-web-browser"],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};
