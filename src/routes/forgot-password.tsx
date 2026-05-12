import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center vpn-page-bg px-6">
      <div className="w-full max-w-md p-8 rounded-2xl border bg-card shadow-card-glow">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4">
          <Mail className="w-6 h-6 text-primary" />
        </div>

        <h1 className="text-2xl font-bold text-center">Восстановление пароля</h1>

        <div className="mt-6 space-y-4 text-sm text-muted-foreground">
          <p className="text-foreground">
            Мы не храним пароли в открытом виде, поэтому восстановление выполняется вручную — это занимает не больше нескольких часов.
          </p>

          <div className="rounded-xl border bg-surface p-4 space-y-3">
            <p className="font-medium text-foreground">Что нужно сделать:</p>
            <ol className="list-decimal list-inside space-y-2 leading-relaxed">
              <li>
                Напишите письмо на{" "}
                <a
                  href="mailto:alexshedmont@gmail.com?subject=Восстановление пароля УбежищеVPN"
                  className="text-primary hover:underline font-medium"
                >
                  alexshedmont@gmail.com
                </a>
              </li>
              <li>
                Отправьте письмо <span className="text-foreground font-medium">с той почты</span>, на которую вы регистрировались
              </li>
              <li>
                В теме письма напишите:{" "}
                <span className="text-foreground font-medium">«Восстановление пароля»</span>
              </li>
            </ol>
          </div>

          <p>
            Мы ответим и пришлём новый пароль на вашу почту.
          </p>
        </div>

        <a
          href="mailto:alexshedmont@gmail.com?subject=Восстановление пароля УбежищеVPN"
          className="mt-6 w-full py-3 rounded-xl font-semibold text-white vpn-primary-button transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Mail className="w-4 h-4" />
          Написать на почту
        </a>

        <Link
          to="/login"
          className="mt-3 w-full py-3 rounded-xl font-medium text-muted-foreground border hover:bg-surface transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Вернуться ко входу
        </Link>
      </div>
    </div>
  );
}
