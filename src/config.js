import { NativeModules, Platform } from "react-native";

const CLOUD_API_BASE_URL = "https://api.homatri.com";

function trimSlash(url) {
  return String(url || "").replace(/\/$/, "");
}

function metroHost() {
  const scriptURL = NativeModules.SourceCode?.scriptURL || "";
  const match = String(scriptURL).match(/https?:\/\/([^:/]+)/);
  const host = match?.[1];
  if (host && host !== "localhost" && host !== "127.0.0.1") {
    return host;
  }
  return Platform.OS === "android" ? "10.0.2.2" : null;
}

/**
 * Cloud: set EXPO_PUBLIC_API_BASE_URL once (EAS / .env).
 * Local phone: reuse the same LAN IP Expo Metro already uses — never localhost.
 */
export function getApiBaseUrl() {
  const fromEnv = trimSlash(process.env.EXPO_PUBLIC_API_BASE_URL);
  if (fromEnv) return fromEnv;

  if (typeof __DEV__ !== "undefined" && __DEV__) {
    const host = metroHost();
    if (host) return `http://${host}:8000`;
  }

  return CLOUD_API_BASE_URL;
}

/**
 * Chef-uploaded reels/photos come back as server-relative URLs (/media/reels/x.mp4).
 * React Native <Image> cannot resolve relative URLs — anchor them to the API base.
 */
export function absoluteMediaUrl(url) {
  const raw = String(url || "");
  if (!raw) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${getApiBaseUrl()}${raw.startsWith("/") ? "" : "/"}${raw}`;
}
