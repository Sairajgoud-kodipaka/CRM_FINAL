'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { apiService } from '@/lib/api-service'

export default function ResetPasswordRequestPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      const res = await apiService.requestPasswordReset(email)
      if (res.success) setMessage(res.data?.detail || 'If an account exists, a reset link has been sent.')
      else setMessage(res.message || 'If an account exists, a reset link has been sent.')
    } catch {
      setMessage('If an account exists, a reset link has been sent.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>Enter your email to receive a reset link</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-sm">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <Button type="submit" disabled={submitting || !email}>Send Reset Link</Button>
          </form>
          {message && <div className="mt-3 text-sm text-muted-foreground">{message}</div>}
          <div className="mt-4 text-sm">
            <button className="text-blue-600 hover:underline" onClick={() => router.push('/')}>Back to Login</button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


