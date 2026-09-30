import type { NextConfig } from 'next'

const operationalApiUrl =
  process.env.OPERATIONAL_API_URL ?? 'http://localhost:3001'

const nextConfig: NextConfig = {
  agentRules: false,
  async rewrites() {
    return [
      {
        source: '/api/backend/operational-assessment/snapshot',
        destination: `${operationalApiUrl}/operational-assessment/snapshot`,
      },
    ]
  },
}

export default nextConfig
