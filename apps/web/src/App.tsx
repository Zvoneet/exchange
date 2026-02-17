import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, tokenStore } from "./api";
import type { AgentListItem } from "@exchange/shared";

function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await api.adminLogin(password);
      tokenStore.set(result.accessToken);
      navigate("/agents");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="panel narrow">
      <h1>Assistant Exchange Admin</h1>
      <form onSubmit={submit}>
        <label>Admin password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
        />
        {error && <p className="error">{error}</p>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

function Protected({ children }: { children: React.ReactNode }) {
  const token = tokenStore.get();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AgentsPage() {
  const [agents, setAgents] = useState<AgentListItem[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const load = async () => {
    try {
      setError("");
      setAgents(await api.getAgents());
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openDetails = async (id: string) => {
    try {
      setError("");
      setSelected(await api.getAgent(id));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const removeAgent = async (id: string) => {
    const confirmed = window.confirm("Delete this agent? This action cannot be undone.");
    if (!confirmed) return;

    try {
      setError("");
      setStatus("");
      await api.deleteAgent(id);
      if (selected?.id === id) {
        setSelected(null);
      }
      setStatus("Agent deleted.");
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="panel">
      <h2>Registered agents</h2>
      {error && <p className="error">{error}</p>}
      {status && <p className="muted">{status}</p>}
      <table>
        <thead>
          <tr>
            <th>Handle</th>
            <th>Display Name</th>
            <th>Type</th>
            <th>Capabilities</th>
            <th>Tags</th>
            <th>Last Seen</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((agent) => (
            <tr key={agent.id} onClick={() => openDetails(agent.id)}>
              <td>{agent.handle ?? "-"}</td>
              <td>{agent.displayName}</td>
              <td>{agent.agentType}</td>
              <td>{agent.capabilitiesCount}</td>
              <td>{agent.tags.join(", ")}</td>
              <td>{agent.lastSeenAt ? new Date(agent.lastSeenAt).toLocaleString() : "-"}</td>
              <td>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void removeAgent(agent.id);
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {selected && (
        <div className="detail">
          <h3>{selected.displayName}</h3>
          <p>{selected.handle ?? "No handle claimed"}</p>
          <button type="button" onClick={() => void removeAgent(selected.id)}>
            Delete Agent
          </button>
          <h4>Capabilities</h4>
          <pre>{JSON.stringify(selected.capabilities, null, 2)}</pre>
          <h4>Metadata</h4>
          <pre>{JSON.stringify(selected.metadata, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

function ConfigPage() {
  const [mode, setMode] = useState<"open" | "code_required">("open");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const config = await api.getConfig();
      setMode(config.registrationMode);
      setStatus(`Current mode: ${config.registrationMode}. Updated ${new Date(config.updatedAt).toLocaleString()}`);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
      const result = await api.updateConfig({
        registrationMode: mode,
        registrationCode: mode === "code_required" ? code : undefined
      });
      setStatus(`Saved mode: ${result.registrationMode}. Updated ${new Date(result.updatedAt).toLocaleString()}`);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="panel narrow">
      <h2>Registration config</h2>
      <form onSubmit={submit}>
        <label>Mode</label>
        <select value={mode} onChange={(e) => setMode(e.target.value as "open" | "code_required")}>
          <option value="open">Open</option>
          <option value="code_required">Code required</option>
        </select>
        {mode === "code_required" && (
          <>
            <label>Registration code</label>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Set registration code" />
          </>
        )}
        {error && <p className="error">{error}</p>}
        {status && <p className="muted">{status}</p>}
        <button type="submit">Save</button>
      </form>
    </div>
  );
}

export function App() {
  const navigate = useNavigate();
  return (
    <div className="app">
      <header>
        <strong>Assistant Exchange</strong>
        <nav>
          <Link to="/agents">Agents</Link>
          <Link to="/config">Config</Link>
          <button
            type="button"
            onClick={() => {
              tokenStore.clear();
              navigate("/login");
            }}
          >
            Logout
          </button>
        </nav>
      </header>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/agents"
          element={
            <Protected>
              <AgentsPage />
            </Protected>
          }
        />
        <Route
          path="/config"
          element={
            <Protected>
              <ConfigPage />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/agents" replace />} />
      </Routes>
    </div>
  );
}
