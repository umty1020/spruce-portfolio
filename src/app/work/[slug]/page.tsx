import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getNeighbors, getProject, projects } from "@/content/projects";
import UiuxDetail from "@/components/detail/uiux/UiuxDetail";
import FilmDetail from "@/components/detail/film/FilmDetail";
import Photobook from "@/components/detail/photobook/Photobook";

export function generateStaticParams() {
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const project = getProject(slug);
  return { title: project ? `${project.title} — SPRUCE` : "SPRUCE" };
}

export default async function ProjectPage(props: PageProps<"/work/[slug]">) {
  const { slug } = await props.params;
  const project = getProject(slug);
  if (!project) notFound();

  if (project.kind === "uiux" && project.uiux) {
    return <UiuxDetail project={{ ...project, uiux: project.uiux }} />;
  }
  if (project.kind === "film" && project.film) {
    return <FilmDetail project={{ ...project, film: project.film }} />;
  }
  if (project.kind === "photobook" && project.photobook) {
    const { prev, next } = getNeighbors(project.slug);
    return <Photobook project={{ ...project, photobook: project.photobook }} prev={prev} next={next} />;
  }

  // 내용이 아직 없는 프로젝트
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
