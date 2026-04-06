"use client";

import dynamic from "next/dynamic";

const TaskflowApp = dynamic(
  () => import("@/app/components/taskflow-app").then((mod) => mod.TaskflowApp),
  {
    ssr: false,
    loading: () => (
      <main className="grid-overlay relative flex-1 overflow-hidden">
        <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
          <div className="panel rounded-[2rem] px-6 py-8">
            <p className="text-sm text-slate-300">Carregando workspace...</p>
          </div>
        </section>
      </main>
    ),
  },
);

export default function Home() {
  return <TaskflowApp />;
}
