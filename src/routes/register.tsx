import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Mail, User } from "lucide-react";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

console.log("LOGIN FILE LOADED");

function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center vpn-page-bg px-6">
      <div className="w-full max-w-md p-8 rounded-2xl border bg-card shadow-card-glow">
        <h1 className="text-2xl font-bold text-center">Регистрация</h1>

        <form className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Имя</label>
            <div className="mt-1 flex items-center gap-2 border rounded-lg px-3 py-2 bg-surface">
              <User className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                className="bg-transparent outline-none w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Email</label>
            <div className="mt-1 flex items-center gap-2 border rounded-lg px-3 py-2 bg-surface">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                className="bg-transparent outline-none w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Пароль</label>
            <div className="mt-1 flex items-center gap-2 border rounded-lg px-3 py-2 bg-surface">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                className="bg-transparent outline-none w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

            <button
            type="submit"
            className="w-full py-3 rounded-xl font-semibold text-white vpn-primary-button transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
            Создать аккаунт
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