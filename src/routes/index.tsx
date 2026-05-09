import { createFileRoute } from "@tanstack/react-router";
import { useReveal } from "../hooks/useReveal";
import { Shield, Zap, Globe, Lock, Smartphone, Settings, Send, Bot, Star } from "lucide-react";
import heroShield from "@/assets/hero-shield.jpg";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

const TG_URL = "https://t.me/vpnasylum_bot";

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
    <path
      d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
      fill="currentColor"
      className="text-brand"
      stroke="currentColor"
      strokeWidth="1"
    />
    <circle cx="12" cy="13" r="2" fill="currentColor" className="text-brand-soft" />
    <path
      d="M12 11V8"
      stroke="currentColor"
      className="text-brand-soft"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const LockIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect
      x="5"
      y="11"
      width="14"
      height="10"
      rx="2"
      fill="currentColor"
      className="text-brand"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M8 11V7a4 4 0 018 0v4"
      stroke="currentColor"
      className="text-brand-soft"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle cx="12" cy="16" r="1.5" fill="currentColor" className="text-brand-soft" />
  </svg>
);

const BoltIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13V2Z"
      fill="currentColor"
      className="text-brand"
      stroke="currentColor"
      strokeWidth="1"
    />
  </svg>
);

const GlobeIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      className="text-brand-soft"
      strokeWidth="1.5"
    />
    <ellipse
      cx="12"
      cy="12"
      rx="4"
      ry="9"
      stroke="currentColor"
      className="text-brand-soft"
      strokeWidth="1.5"
    />
    <path
      d="M3 12h18M3 8h18M3 16h18"
      stroke="currentColor"
      className="text-brand-soft"
      strokeWidth="1.2"
    />
  </svg>
);

const TelegramIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="currentColor" className="text-telegram" />
    <path
      d="M17.5 7.5L15 16.5l-3-2.5-1.5 1.5V13L7 11.5l10.5-4z"
      fill="currentColor"
      className="text-foreground"
    />
  </svg>
);

const BotIcon = ({ className = "h-8 w-8" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect
      x="4"
      y="8"
      width="16"
      height="12"
      rx="3"
      fill="currentColor"
      className="text-surface-soft"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <circle cx="9" cy="14" r="2" fill="currentColor" className="text-brand-soft" />
    <circle cx="15" cy="14" r="2" fill="currentColor" className="text-brand-soft" />
    <path
      d="M12 3v5M9.5 3h5M1 14h3M20 14h3"
      stroke="currentColor"
      className="text-brand-soft"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const MonitorIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect
      x="2"
      y="4"
      width="14"
      height="10"
      rx="2"
      stroke="currentColor"
      className="text-brand-soft"
      strokeWidth="1.5"
    />
    <path
      d="M9 14v3M6 17h6"
      stroke="currentColor"
      className="text-brand-soft"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <rect
      x="17"
      y="10"
      width="5"
      height="7"
      rx="1"
      stroke="currentColor"
      className="text-brand-soft"
      strokeWidth="1.2"
    />
  </svg>
);

const ShieldSmall = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
      fill="currentColor"
      className="text-surface-soft"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M9 12l2 2 4-4"
      stroke="currentColor"
      className="text-brand-soft"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const GearIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle
      cx="12"
      cy="12"
      r="3"
      stroke="currentColor"
      className="text-brand-soft"
      strokeWidth="1.5"
    />
    <path
      d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
      stroke="currentColor"
      className="text-brand-soft"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6 text-star" fill="currentColor" aria-hidden="true">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const ArrowRight = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className="hidden h-6 w-14 text-muted-foreground md:block"
    aria-hidden="true"
  >
    <path d="M3 12h18M16 7l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const CountryFlag = ({ code, label }: { code: "fi" | "de" | "nl"; label: string }) => (
  <span className={`country-flag country-flag-${code}`} role="img" aria-label={`Флаг: ${label}`} />
);

const servers = [
  { code: "fi" as const, name: "Финляндия", desc: "Подходит для стабильного соединения и низкого пинга." },
  { code: "de" as const, name: "Германия", desc: "Оптимальный баланс скорости и надёжности." },
  { code: "us" as const, name: "США", desc: "Максимальная свобода доступа и обход ограничений." },
];

const advantages = [
  { icon: <LockIcon className="h-7 w-7" />, label: "Отсутствие\nлогов" },
  { icon: <BoltIcon className="h-7 w-7" />, label: "Высокая\nскорость" },
  { icon: <GlobeIcon className="h-7 w-7" />, label: "Европейские\nсерверы" },
  { icon: <MonitorIcon className="h-7 w-7" />, label: "Работа на всех\nустройствах" },
  { icon: <ShieldSmall className="h-7 w-7" />, label: "Обход\nблокировок" },
  { icon: <GearIcon className="h-7 w-7" />, label: "Простая\nнастройка" },
];

function ServerCard({ s, index }: { s: typeof servers[number]; index: number }) {
  const { ref, visible } = useReveal();

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "visible" : ""} rounded-xl border border-border bg-surface-soft/70 p-5 transition hover:-translate-y-1 hover:border-brand-soft/70`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="flex gap-4">
        <CountryFlag code={s.code} label={s.name} />
        <div>
          <h3 className="font-black">{s.name}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {s.desc}
          </p>
        </div>
      </div>
    </div>
  );
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useReveal();

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function Index() {
  return (
    <div className="vpn-page-bg min-h-screen bg-background text-foreground">
      {/* HERO */}
      <header className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "var(--gradient-hero)" }}
        />
        <nav className="relative max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg">
              Убежище<span className="text-primary">VPN</span>
            </span>
          </div>
        
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            {/* <span>Приватность</span>
            <span className="w-1 h-1 rounded-full bg-primary" /> */}
              <Link
                to="/login"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                Вход
              </Link>

              <span className="w-1 h-1 rounded-full bg-primary" />

              <Link
                to="/register"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                Регистрация
              </Link>
          </div>
        </nav>

        <section className="relative max-w-6xl mx-auto px-6 pt-10 pb-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Убежище<span className="text-primary">VPN</span>
            </h1>
            <p className="mt-4 text-xl md:text-2xl font-semibold">
              Приватный интернет без ограничений
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed max-w-md">
              Быстрое подключение через Telegram.<br />
              Без регистрации и лишних действий.
            </p>

            <a
              href={TG_URL}
              className="mt-8 inline-flex flex-col items-center px-8 py-4 rounded-xl text-primary-foreground font-semibold transition-transform hover:scale-[1.02]"
              style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-glow)" }}
            >
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" /> Запустить в Telegram
              </span>
              <span className="text-xs font-normal opacity-80 mt-1">
                Подключение занимает меньше минуты
              </span>
            </a>

            <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><Lock className="w-4 h-4 text-primary" /> Защищенность</span>
              <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> Стабильное соединение</span>
              <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> Доступ к зарубежным сервисам</span>
            </div>
          </div>

    <div className="relative mx-auto hidden h-[380px] w-full max-w-lg items-center justify-center sm:flex">
          <div className="absolute inset-8 rounded-full bg-brand/20 blur-3xl" />
          <div className="orbital-spin absolute h-72 w-72 rounded-full border border-brand-soft/30" />
          <div className="absolute h-48 w-[430px] rounded-[50%] border border-accent/45 rotate-[-14deg]" />
          <div className="absolute h-44 w-[390px] rounded-[50%] border border-brand/45 rotate-[14deg]" />
          <div className="absolute right-4 top-8 h-52 w-72 opacity-35 [background-image:radial-gradient(circle,currentColor_1px,transparent_1px)] [background-size:10px_10px] text-brand-bright" />
          <svg
            viewBox="0 0 200 240"
            className="shield-float relative z-10 h-72 w-72 drop-shadow-2xl"
            aria-label="Защитный щит VPN"
          >
            <defs>
              <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="oklch(0.46 0.22 292)" />
                <stop offset="100%" stopColor="oklch(0.16 0.08 281)" />
              </linearGradient>
              <linearGradient id="shieldBorder" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="oklch(0.82 0.13 292)" />
                <stop offset="100%" stopColor="oklch(0.58 0.25 292)" />
              </linearGradient>
            </defs>
            <path
              d="M100 10L20 45v65c0 55 35 95 80 110 45-15 80-55 80-110V45L100 10z"
              fill="url(#shieldGrad)"
              stroke="url(#shieldBorder)"
              strokeWidth="3"
            />
            <path d="M100 24v180" stroke="oklch(0.75 0.16 292 / 0.22)" strokeWidth="2" />
            <circle
              cx="100"
              cy="116"
              r="28"
              fill="oklch(0.19 0.08 281)"
              stroke="oklch(0.58 0.25 292)"
              strokeWidth="2"
            />
            <path
              d="M88 112a12 12 0 1124 0v12H88v-12z"
              fill="none"
              stroke="oklch(0.82 0.13 292)"
              strokeWidth="3"
            />
            <rect
              x="83"
              y="121"
              width="34"
              height="25"
              rx="5"
              fill="oklch(0.13 0.05 281)"
              stroke="oklch(0.82 0.13 292)"
              strokeWidth="2"
            />
          </svg>
          <div className="absolute bottom-5 h-7 w-48 rounded-full bg-brand/45 blur-xl" />
        </div>

        </section>
      </header>

      {/* SERVERS */}
      <section className="mx-auto max-w-6xl px-5 sm:px-7">
        <div className="vpn-panel rounded-2xl border p-6 sm:p-8">
          <h2 className="text-center text-2xl font-black">Серверы</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {servers.map((s, i) => (
              <Reveal key={s.name} delay={i * 100}>
                <div className="rounded-xl border border-border bg-surface-soft/70 p-5 transition hover:-translate-y-1 hover:border-brand-soft/70">
                  <div className="flex gap-4">
                    <CountryFlag code={s.code} label={s.name} />
                    <div>
                      <h3 className="font-black">{s.name}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <Section title="Как это работает" bare>
        <div className="grid md:grid-cols-3 gap-8 relative">
          {[
            { icon: Send, num: 1, text: "Открываете Telegram" },
            { icon: Bot, num: 2, text: "Запускаете бота" },
            { icon: Lock, num: 3, text: "Получаете доступ к VPN" },
          ].map(({ icon: Icon, num, text }, i) => (
            <Reveal key={num} delay={i * 150}>
              <div className="flex flex-col items-center text-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center border border-border"
                  style={{ background: "var(--surface-elevated)", boxShadow: "var(--shadow-glow)" }}
                >
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <div className="mt-4 text-2xl font-bold text-primary">{num}</div>
                <p className="mt-1 text-muted-foreground">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="text-center text-muted-foreground mt-10">
          Без сложной настройки и технических знаний.
        </p>
      </Section>

      {/* PRICING */}
      <Section title="Тарифы">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { name: "Пробный", desc1: "3 дня доступа", desc2: "с ограничением по трафику", price: "0 ₽" },
            { name: "1 месяц", desc1: "30 дней", desc2: "доступ ко всем серверам", price: "99 ₽", popular: true },
            { name: "3 месяца", desc1: "90 дней", desc2: "доступ ко всем серверам", price: "269 ₽" },
            { name: "12 месяца", desc1: "365 дней", desc2: "доступ ко всем серверам", price: "899 ₽" },
          ].map((p, i) => (
            <Reveal key={p.name} delay={i * 120}>
              <PriceCard {...p} />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* FEATURES */}
      <Section title="Преимущества" bare>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[
            { icon: Lock, text: "Надежная защита" },
            { icon: Zap, text: "Высокая скорость" },
            { icon: Globe, text: "Европейские серверы" },
            { icon: Smartphone, text: "Работа на всех устройствах" },
            { icon: Shield, text: "Обход блокировок" },
            { icon: Settings, text: "Простая настройка" },
          ].map(({ icon: Icon, text }, i) => (
            <Reveal key={text} delay={i * 80}>
              <div className="p-5 rounded-xl bg-card border border-border flex flex-col items-center text-center gap-3 transition-transform hover:-translate-y-1">
                <Icon className="w-7 h-7 text-primary" />
                <span className="text-sm font-medium leading-snug">{text}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* TRUST */}
      <Section bare>
        <Reveal>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-semibold">Нам доверяют</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Сервисом уже пользуются сотни клиентов.<br />
                Стабильная работа и регулярные обновления.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-lg font-semibold ml-2">4.9 / 5</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">по отзывам пользователей</p>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* FINAL CTA */}
      
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <Reveal>
        <div
          className="rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6"
          style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-elevated)" }}
        >
          <h3 className="text-2xl md:text-3xl font-bold text-primary-foreground text-center md:text-left">
            Готовы получить доступ<br />к свободному интернету?
          </h3>
          <a
            href={TG_URL}
            className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-[#229ED9] text-white font-semibold hover:brightness-110 transition"
          >
            <Send className="w-5 h-5" /> Открыть Telegram-бота
          </a>
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} УбежищеVPN
        </p>
        </Reveal>
      </section>
    </div>
  );
}

function Section({ title, children, bare }: { title?: string; children: React.ReactNode; bare?: boolean }) {
  return (
    <section className="max-w-6xl mx-auto px-6 py-14">
      {bare ? (
        <>
          {title && <h2 className="text-3xl font-bold text-center mb-10">{title}</h2>}
          {children}
        </>
      ) : (
        <div
          className="rounded-3xl p-8 md:p-10 border border-border"
          style={{ background: "var(--surface)", boxShadow: "var(--shadow-card)" }}
        >
          {title && <h2 className="text-3xl font-bold text-center mb-10">{title}</h2>}
          {children}
        </div>
      )}
    </section>
  );
}

function PriceCard({ name, desc1, desc2, price, popular }: {
  name: string; desc1: string; desc2: string; price: string; popular?: boolean;
}) {
  return (
    <div
      className="relative rounded-2xl border p-6 flex flex-col items-center text-center"
      style={{
        background: popular ? "var(--surface-elevated)" : "var(--surface)",
        borderColor: popular ? "oklch(0.62 0.22 280 / 0.6)" : undefined,
        boxShadow: popular ? "var(--shadow-elevated)" : "var(--shadow-card)",
      }}
    >
      {popular && (
        <div
          className="absolute -top-3 px-4 py-1 rounded-full text-xs font-semibold text-primary-foreground tracking-wider"
          style={{ background: "var(--gradient-primary)" }}
        >
          ПОПУЛЯРНЫЙ
        </div>
      )}
      <h3 className="font-semibold text-lg mt-2">{name}</h3>
      <p className="mt-3 text-sm text-muted-foreground">{desc1}</p>
      <p className="text-sm text-muted-foreground">{desc2}</p>
      <div className="my-5 text-3xl font-bold">{price}</div>
      <a
        href={TG_URL}
        className="w-full px-4 py-3 rounded-xl text-sm font-semibold transition hover:-translate-y-0.5 "
        style={
          popular
            ? { background: "var(--gradient-cta)", color: "var(--primary-foreground)" }
            : { background: "var(--surface-elevated)", color: "var(--foreground)", border: "1px solid var(--border)" }
        }
      >
        Подключить через Telegram
      </a>
    </div>
  );
}
