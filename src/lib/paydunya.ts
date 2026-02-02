type CreateCheckoutParams = {
  amount: string
  description: string
  sessionId: string
  returnUrl: string
  callbackUrl?: string
}

export type PaydunyaCheckout = { url: string; token: string }

export async function createCheckout(params: CreateCheckoutParams): Promise<PaydunyaCheckout> {
  const useMock = String(process.env.PAYDUNYA_USE_MOCK || 'true').toLowerCase() === 'true'
  if (useMock) {
    const url = `${params.returnUrl}?status=success&session=${encodeURIComponent(params.sessionId)}`
    return { url, token: params.sessionId }
  }
  const masterKey = process.env.PAYDUNYA_MASTER_KEY
  const publicKey = process.env.PAYDUNYA_PUBLIC_KEY
  const privateKey = process.env.PAYDUNYA_PRIVATE_KEY
  const token = process.env.PAYDUNYA_TOKEN
  if (!masterKey || !publicKey || !privateKey || !token) {
    // Fallback to mock if credentials missing
    const url = `${params.returnUrl}?status=success&session=${encodeURIComponent(params.sessionId)}`
    return { url, token: params.sessionId }
  }
  // TODO: Implement real PayDunya API call here when credentials and API details are confirmed.
  // For now, fall back to mock behavior to keep flow functional.
  const url = `${params.returnUrl}?status=success&session=${encodeURIComponent(params.sessionId)}`
  return { url, token: params.sessionId }
}
