import { PodcastPlayerPage } from "@/components/player/PodcastPlayerPage"

/**
 * Workspace Page - 工作区页面
 * 
 * 显示播放器界面，包含波形、热区、转录等
 */

interface WorkspacePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { id } = await params

  return <PodcastPlayerPage audioId={id} />
}

export async function generateMetadata({ params }: WorkspacePageProps) {
  const { id } = await params

  return {
    title: `Workspace - ${id} | Simpod`,
    description: "Podcast workspace with hotzones and transcription",
  }
}
