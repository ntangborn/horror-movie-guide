import { redirect } from 'next/navigation'

// Signup is now handled by magic link on the login page
export default function SignUpPage() {
  redirect('/login')
}
