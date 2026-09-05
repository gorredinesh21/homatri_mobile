// Shared API Client connecting Expo React Native Mobile App to FastAPI Backend

import { getApiBaseUrl } from "../config";

async function parseError(res) {
  try {
    const err = await res.json();
    const detail = err.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((d) => d.msg || d).join(" ");
    return JSON.stringify(detail || err);
  } catch {
    return `Request failed (${res.status})`;
  }
}

async function apiRequest(path, { method = "GET", body, token } = {}) {
  const base = getApiBaseUrl();
  let response;
  try {
    response = await fetch(`${base}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new Error(
      `Cannot reach Homatri server at ${base}. On a phone, localhost will not work. Set EXPO_PUBLIC_API_BASE_URL for cloud, or keep Expo and the API on the same Wi-Fi. (${error.message})`
    );
  }
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function registerMobileUser({ phone, email, password, fullName }) {
  return apiRequest("/api/v1/auth/register", {
    method: "POST",
    body: { phone, email, password, full_name: fullName },
  });
}

export async function loginMobileUser({ phone, password }) {
  return apiRequest("/api/v1/auth/login", {
    method: "POST",
    body: { phone, password },
  });
}

export async function setupUsername({ phone, requestedUsername }) {
  return apiRequest("/api/v1/auth/setup-username", {
    method: "POST",
    body: { phone, requested_username: requestedUsername || null },
  });
}

export async function fetchReelsFeed() {
  return apiRequest("/api/v1/reels/feed");
}

export async function fetchChefVideoGallery(chefPhone) {
  try {
    return await apiRequest(`/api/v1/reels/gallery/${encodeURIComponent(chefPhone)}`);
  } catch (e) {
    return [];
  }
}

export async function fetchReelComments(reelId) {
  try {
    return await apiRequest(`/api/v1/reels/${encodeURIComponent(reelId)}/comments`);
  } catch (e) {
    return [];
  }
}

export async function postReelComment(payload) {
  return apiRequest("/api/v1/reels/comments", { method: "POST", body: payload });
}

export async function sendUserMessage(payload) {
  return apiRequest("/api/v1/chat/send-user-message", { method: "POST", body: payload });
}

export async function fetchChatThread(userPhone, peerPhone) {
  return apiRequest(
    `/api/v1/chat/thread?user_phone=${encodeURIComponent(userPhone)}&peer_phone=${encodeURIComponent(peerPhone)}`
  );
}

export async function fetchChatInbox(userPhone) {
  try {
    return await apiRequest(`/api/v1/chat/inbox?user_phone=${encodeURIComponent(userPhone)}`);
  } catch (e) {
    return [];
  }
}

export async function canMessageUser(phone) {
  try {
    return await apiRequest(`/api/v1/chat/can-message/${encodeURIComponent(phone)}`);
  } catch (e) {
    return {
      allowed: false,
      detail:
        "To protect kitchen cooking quality, chefs cannot be direct-messaged. Please comment on their reels or order their tiffin!",
    };
  }
}

export async function fetchKitchens(cluster = "Ghansoli", mealWindow) {
  const params = new URLSearchParams();
  if (cluster) params.set("cluster", cluster);
  if (mealWindow && mealWindow !== "ALL") params.set("meal_window", mealWindow);
  const suffix = params.toString() ? `?${params}` : "";
  return apiRequest(`/api/v1/kitchens${suffix}`);
}

export async function fetchBulkTemplates() {
  try {
    return await apiRequest("/api/v1/bulk/templates");
  } catch (e) {
    return [];
  }
}

export async function submitBulkCheckout(payload, token) {
  return apiRequest("/api/v1/bulk/checkout", { method: "POST", token, body: payload });
}

export async function likeReel(reelId, token) {
  return apiRequest(`/api/v1/reels/${encodeURIComponent(reelId)}/like`, {
    method: "POST",
    token,
  });
}

export async function fetchSavedAddresses(token) {
  return apiRequest("/api/v1/customer/addresses", { token });
}

export async function saveCustomerAddress(body, token) {
  return apiRequest("/api/v1/customer/addresses", { method: "POST", token, body });
}

export async function fetchMyOrders(token) {
  return apiRequest("/api/v1/orders/mine", { token });
}

export async function checkoutMobileOrder(orderPayload, token) {
  return apiRequest("/api/v1/orders/checkout", {
    method: "POST",
    token,
    body: orderPayload,
  });
}

export async function verifyOrderPayment(orderId, token) {
  return apiRequest(`/api/v1/orders/${encodeURIComponent(orderId)}/verify-payment`, {
    method: "POST",
    token,
    body: { simulate: true },
  });
}

export async function fetchOrderDetail(orderId, token) {
  return apiRequest(`/api/v1/orders/${encodeURIComponent(orderId)}`, { token });
}
