import { redirect } from 'next/navigation'

// Password reset is no longer needed - using magic link only
export default function ResetPasswordPage() {
  redirect('/login')
}
