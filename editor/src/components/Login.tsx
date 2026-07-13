import { useState } from "react";
import type { SessionState } from "../useSession.ts";

export function Login({ session }: { session: SessionState }) {
  const [password, setPassword] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password) void session.login(password);
  }

  return (
    <div className="login">
      <form className="login-box" onSubmit={submit}>
        <h1>Editor RC</h1>
        <p className="login-sub">Este editor controla los equipos de la instalación.</p>

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />

        {session.error && <p className="login-err">{session.error}</p>}

        <button className="btn btn-primary" type="submit" disabled={session.submitting || !password}>
          {session.submitting ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
