import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { requestPasswordResetFn } from "@/api/auth";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await requestPasswordResetFn({ data: { email } });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка отправки");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center vpn-page-bg px-6">
      <div className="w-full max-w-md p-8 rounded-2xl border bg-card shadow-card-glow">
        {sent ? (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 mx-auto">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold">Письмо отправлено</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Если аккаунт с адресом <span className="text-foreground font-medium">{email}</span> существует, на него придёт письмо со ссылкой для сброса пароля. Ссылка действует 1 час.
            </p>
            <p className="text-muted-foreground text-sm">
              Не пришло? Проверьте папку «Спам».
            </p>
            <Link
              to="/login"
              className="mt-2 w-full py-3 rounded-xl font-medium text-muted-foreground border hover:bg-surface transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Вернуться ко входу
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4">
              <Mail className="w-6 h-6 text-primary" />
            </div>

            <h1 className="text-2xl font-bold text-center">Восстановление пароля</h1>
            <p className="text-center text-sm text-muted-foreground mt-2">
              Введите email — мы пришлём ссылку для сброса пароля
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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
                    placeholder="your@email.com"
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
                {loading ? "Отправляем..." : "Отправить ссылку"}
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
