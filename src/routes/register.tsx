import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Mail, User } from "lucide-react";
import { registerFn } from "@/api/auth";

export const Route = createFileRoute("/register")({
  beforeLoad: ({ context }) => {
    if (context.user) throw redirect({ to: "/dashboard" });
  },
  component: RegisterPage,
});

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await registerFn({ data: { name, email, password } });
      await navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center vpn-page-bg px-6">
      <div className="w-full max-w-md p-8 rounded-2xl border bg-card shadow-card-glow">
        <h1 className="text-2xl font-bold text-center">Регистрация</h1>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm text-muted-foreground">Имя</label>
            <div className="mt-1 flex items-center gap-2 border rounded-lg px-3 py-2 bg-surface">
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                className="bg-transparent outline-none w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Email</label>
            <div className="mt-1 flex items-center gap-2 border rounded-lg px-3 py-2 bg-surface">
              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="email"
                className="bg-transparent outline-none w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Пароль</label>
            <div className="mt-1 flex items-center gap-2 border rounded-lg px-3 py-2 bg-surface">
              <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="password"
                className="bg-transparent outline-none w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white vpn-primary-button transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60 disabled:pointer-events-none"
          >
            {loading ? "Создаём аккаунт..." : "Создать аккаунт"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Уже есть аккаунт?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
