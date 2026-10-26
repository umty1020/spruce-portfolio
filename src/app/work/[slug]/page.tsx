import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, projects } from "@/content/projects";

export function generateStaticParams() {
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const project = getProject(slug);
  return { title: project ? `${project.title} — SPRUCE` : "SPRUCE" };
}

// 상세 페이지 자리 (A·B·C 구성은 이후 단계에서 채움)
export default async function ProjectPage(props: PageProps<"/work/[slug]">) {
  const { slug } = await props.params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-[6px]">
      <p className="wf-title">
        {project.no} — {project.title}
      </p>
      <p className="wf-caption text-text-muted">상세 페이지 준비 중</p>
      <Link href="/" className="wf-mono mt-[24px] text-text-muted underline">
        ← Work
      </Link>
    </main>
  );
}
