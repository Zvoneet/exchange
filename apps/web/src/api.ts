import type { AgentListItem } from "@exchange/shared";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000/v1";
const ADMIN_TOKEN_KEY = "exchange_admin_token";

export const tokenStore = {
  get() {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  },
  set(token: string) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  }
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = tokenStore.get();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  async adminLogin(password: string): Promise<{ accessToken: string }> {
    return request("/admin/login", {
      method: "POST",
      body: JSON.stringify({ password })
    });
  },
  async getAgents(): Promise<AgentListItem[]> {
    return request("/admin/agents");
  },
  async getAgent(id: string): Promise<any> {
    return request(`/admin/agents/${id}`);
  },
  async deleteAgent(id: string): Promise<{ ok: boolean }> {
    return request(`/admin/agents/${id}`, {
      method: "DELETE"
    });
  },
  async getConfig(): Promise<{ registrationMode: "open" | "code_required"; codeConfigured: boolean; updatedAt: string }> {
    return request("/admin/config");
  },
  async updateConfig(payload: {
    registrationMode: "open" | "code_required";
    registrationCode?: string;
  }): Promise<{ registrationMode: "open" | "code_required"; updatedAt: string }> {
    return request("/admin/config", {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  }
};
