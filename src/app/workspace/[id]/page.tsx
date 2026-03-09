import { PodcastPlayerPage } from "@/components/player/PodcastPlayerPage"

interface WorkspacePageProps {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    audioUrl?: string
  }>
}

export default async function WorkspacePage({ params, searchParams }: WorkspacePageProps) {
  const { id } = await params
  const { audioUrl } = await searchParams

  console.log('[Workspace Page] Received params:', { id, audioUrl })

  return <PodcastPlayerPage audioId={id} audioUrl={audioUrl} />
}

export async function generateMetadata({ params }: WorkspacePageProps) {
  const { id } = await params

  return {
    title: `Workspace - ${id} | Simpod`,
    description: "Podcast workspace with hotzones and transcription",
  }
}
