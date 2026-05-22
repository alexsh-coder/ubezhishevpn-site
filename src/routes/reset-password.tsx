import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";
import { resetPasswordFn } from "@/api/auth";
import { z } from "zod";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/reset-password")({
  validateSearch: searchSchema,
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center vpn-page-bg px-6">
        <div className="w-full max-w-md p-8 rounded-2xl border bg-card shadow-card-glow text-center space-y-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 mx-auto">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Недействительная ссылка</h1>
          <p className="text-muted-foreground text-sm">
            Ссылка для сброса пароля недействительна или устарела.
          </p>
          <Link
            to="/forgot-password"
            className="mt-2 w-full py-3 rounded-xl font-semibold text-white vpn-primary-button transition-all duration-200 hover:brightness-110 flex items-center justify-center"
          >
            Запросить новую ссылку
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Пароли не совпадают");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await resetPasswordFn({ data: { token: token!, password } });
      setDone(true);
      setTimeout(() => navigate({ to: "/login" }), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сброса пароля");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center vpn-page-bg px-6">
      <div className="w-full max-w-md p-8 rounded-2xl border bg-card shadow-card-glow">
        {done ? (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 mx-auto">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold">Пароль изменён</h1>
            <p className="text-muted-foreground text-sm">
              Через несколько секунд вы будете перенаправлены на страницу входа.
            </p>
            <Link
              to="/login"
              className="mt-2 w-full py-3 rounded-xl font-semibold text-white vpn-primary-button transition-all duration-200 hover:brightness-110 flex items-center justify-center"
            >
              Войти
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>

            <h1 className="text-2xl font-bold text-center">Новый пароль</h1>
            <p className="text-center text-sm text-muted-foreground mt-2">
              Придумайте надёжный пароль для вашего аккаунта
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm text-muted-foreground">Новый пароль</label>
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
                    placeholder="Минимум 6 символов"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Повторите пароль</label>
                <div className="mt-1 flex items-center gap-2 border rounded-lg px-3 py-2 bg-surface">
                  <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    type="password"
                    className="bg-transparent outline-none w-full"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Повторите пароль"
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-white vpn-primary-button transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60 disabled:pointer-events-none"
              >
                {loading ? "Сохраняем..." : "Сохранить пароль"}
              </button>
            </form>

            <Link
              to="/login"
              className="mt-3 w-full py-3 rounded-xl font-medium text-muted-foreground border hover:bg-surface transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Вернуться ко входу
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
