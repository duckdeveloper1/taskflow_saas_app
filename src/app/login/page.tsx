"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authenticateDemoUser } from "@/lib/demo-store";

const githubPagesUrl = process.env.NEXT_PUBLIC_GITHUB_PAGES_URL;
const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("ronald@taskflow.dev");
  const [password, setPassword] = useState("taskflow123");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const session = authenticateDemoUser(email, password);

      if (!session) {
        throw new Error("Credenciais inválidas. Tente novamente.");
      }

      router.push("/");
      router.refresh();
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Não foi possível entrar na plataforma.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid-overlay relative flex min-h-screen items-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.14),transparent_26%)]" />

      <section className="relative mx-auto grid w-full max-w-6xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
        <div className="panel rounded-[2.2rem] p-7 sm:p-8">
          <p className="eyebrow text-xs text-accent">Acesso ao workspace</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
            Entre no TaskFlow para acompanhar tarefas, responsáveis e contexto operacional.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
            Esta etapa adiciona a camada de autenticação do projeto e aproxima o
            portfólio de um produto SaaS real.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              "Sessão persistida por cookie seguro",
              "Usuário vinculado ao workspace",
              "Base pronta para evoluir com permissões",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-4 text-sm leading-6 text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="panel rounded-[2.2rem] p-7 sm:p-8">
          <p className="text-sm text-slate-400">Entrar</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">
            Acesse seu workspace
          </h2>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <span className="block text-sm text-slate-300">E-mail</span>
              <input
                className="input-base"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <span className="block text-sm text-slate-300">Senha</span>
              <input
                className="input-base"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Entrando..." : "Entrar na plataforma"}
            </button>
          </form>

          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-white">Credenciais de demo</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              E-mail: <span className="font-mono text-slate-100">ronald@taskflow.dev</span>
              <br />
              Senha: <span className="font-mono text-slate-100">taskflow123</span>
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {githubPagesUrl ? (
              <a
                href={githubPagesUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/10"
              >
                Abrir GitHub Pages
              </a>
            ) : null}
            {vercelUrl ? (
              <a
                href={vercelUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-sky-400/20 bg-sky-400/12 px-4 py-2 text-xs font-medium text-sky-100 transition hover:bg-sky-400/18"
              >
                Abrir Vercel
              </a>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
