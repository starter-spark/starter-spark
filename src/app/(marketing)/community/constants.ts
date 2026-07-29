// Statuses that are publicly listable in the forum. Keep the posts page,
// the /api/community/posts route, and PostsList badges in sync via this.
export const PUBLIC_POST_STATUSES = ['open', 'solved'] as const

export type PublicPostStatus = (typeof PUBLIC_POST_STATUSES)[number]
