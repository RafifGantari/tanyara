export interface Chatbot {
  id: string;
  organization_id: string;
  organization_slug?: string | null;
  organization_name?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  welcome_message: string;
  system_prompt?: string | null;
  is_active: boolean;
  document_count: number;
  conversation_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatbotPublic {
  id: string;
  name: string;
  description?: string | null;
  welcome_message: string;
  slug: string;
  organization_slug?: string | null;
  organization_name?: string | null;
  is_active: boolean;
}

export interface DocumentItem {
  id: string;
  chatbot_id: string;
  name: string;
  mime_type?: string | null;
  file_size_bytes?: number | null;
  status: "pending" | "processing" | "indexed" | "failed";
  error_message?: string | null;
  chunk_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  sources?: string[];
  created_at: string;
}

export interface HealthStatus {
  status: string;
  version: string;
  environment: string;
  supabase_configured: boolean;
  gemini_configured: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  role: string;
  created_at: string;
  updated_at: string;
}

