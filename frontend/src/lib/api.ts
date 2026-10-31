import { Chatbot, ChatbotPublic, DocumentItem, ChatMessage, HealthStatus, Organization } from "@/types";
import { getAccessToken } from "./supabase";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function fetchJson<T>(
  endpoint: string,
  options: RequestInit = {},
  requireAuth: boolean = false
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  // Attach Supabase access token if user has active session
  try {
    const token = await getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  } catch (err) {
    // Session token retrieval silent fallback
  }

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      const message =
        errorBody.detail ||
        errorBody.error ||
        `Permintaan gagal dengan status ${res.status}`;
      throw new Error(typeof message === "string" ? message : JSON.stringify(message));
    }
    return await res.json();
  } catch (err: any) {
    console.warn(`API call failed for ${endpoint}:`, err.message);
    throw err;
  }
}

export const api = {
  // Health
  getHealth: () => fetchJson<HealthStatus>("/health"),

  // Organizations (Protected)
  listOrganizations: () => fetchJson<Organization[]>("/api/v1/organizations", {}, true),

  // Chatbots (Protected)
  listChatbots: () => fetchJson<Chatbot[]>("/api/v1/chatbots", {}, true),
  getChatbot: (id: string) => fetchJson<Chatbot>(`/api/v1/chatbots/${id}`, {}, true),
  createChatbot: (data: Partial<Chatbot>) =>
    fetchJson<Chatbot>("/api/v1/chatbots", {
      method: "POST",
      body: JSON.stringify(data),
    }, true),
  updateChatbot: (id: string, data: Partial<Chatbot>) =>
    fetchJson<Chatbot>(`/api/v1/chatbots/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }, true),

  // Public Chat (Unauthenticated)
  getPublicChatbot: (slug: string) =>
    fetchJson<ChatbotPublic>(`/api/v1/public/chatbots/${slug}`),
  sendMessage: (slug: string, message: string, conversation_id?: string) =>
    fetchJson<ChatMessage>(`/api/v1/public/chat/${slug}/messages`, {
      method: "POST",
      body: JSON.stringify({ message, conversation_id }),
    }),

  // Documents
  listDocuments: (chatbotId: string) =>
    fetchJson<DocumentItem[]>(`/api/v1/chatbots/${chatbotId}/documents`, {}, true),

  // Direct Document File Upload (FormData)
  uploadDocumentFile: async (chatbotId: string, file: File): Promise<DocumentItem> => {
    const url = `${API_BASE_URL}/api/v1/chatbots/${chatbotId}/documents/upload`;
    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    const token = await getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      method: "POST",
      body: formData,
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Gagal mengunggah berkas ke server.");
    }

    return await res.json();
  },
};
