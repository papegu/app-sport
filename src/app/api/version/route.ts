export async function GET() {
  const body = {
    commit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || null,
    branch: process.env.VERCEL_GIT_COMMIT_REF || process.env.GITHUB_REF_NAME || null,
    deployedAt: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV || null,
  }
  return Response.json(body)
}
