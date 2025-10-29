'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { apiService } from '@/lib/api-service'

export default function ResetPasswordConfirmPage() {
  const params = useSearchParams()
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const uid = params.get('uid') || ''
  const token = params.get('token') || ''

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || newPassword !== confirmPassword) {
      setMessage('Passwords do not match')
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const res = await apiService.confirmPasswordReset(uid, token, newPassword)
      if (res.success) {
        setMessage('Password reset successful. Redirecting to login...')
        setTimeout(() => router.push('/'), 1500)
      } else {
        setMessage(res.message || 'Password reset failed')
      }
    } catch (e: any) {
      setMessage(e?.message || 'Password reset failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>Choose a new password for your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-sm">New Password</label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div>
              <label className="text-sm">Confirm Password</label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={submitting || !newPassword || newPassword !== confirmPassword}>Reset Password</Button>
          </form>
          {message && <div className="mt-3 text-sm text-muted-foreground">{message}</div>}
        </CardContent>
      </Card>
    </div>
  )
}


