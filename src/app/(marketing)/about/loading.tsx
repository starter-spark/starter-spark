import {
  AboutGallerySkeleton,
  AboutHeroSkeleton,
  AboutStorySkeleton,
  AboutTeamSkeleton,
} from './skeletons'

export default function AboutLoading() {
  return (
    <div>
      <AboutHeroSkeleton />
      <AboutStorySkeleton />
      <AboutTeamSkeleton />
      <AboutGallerySkeleton />
    </div>
  )
}
