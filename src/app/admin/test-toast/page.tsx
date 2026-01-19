'use client'

import { useToast } from '@/components/ui/Toast'

export default function TestToastPage() {
  const toast = useToast()

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-white mb-6">Toast Notification Test</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => toast.success('Success!', 'Your action was completed successfully.')}
          className="px-4 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-500 transition-colors"
        >
          Success Toast
        </button>

        <button
          onClick={() => toast.error('Error!', 'Something went wrong. Please try again.')}
          className="px-4 py-3 rounded-lg bg-red-600 text-white font-medium hover:bg-red-500 transition-colors"
        >
          Error Toast
        </button>

        <button
          onClick={() => toast.warning('Warning!', 'Please review before continuing.')}
          className="px-4 py-3 rounded-lg bg-yellow-600 text-white font-medium hover:bg-yellow-500 transition-colors"
        >
          Warning Toast
        </button>

        <button
          onClick={() => toast.info('Info', 'Here is some helpful information.')}
          className="px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors"
        >
          Info Toast
        </button>
      </div>

      <div className="pt-6 border-t border-gray-800">
        <h2 className="text-lg font-semibold text-white mb-4">Multiple Toasts</h2>
        <button
          onClick={() => {
            toast.success('First toast')
            setTimeout(() => toast.info('Second toast'), 300)
            setTimeout(() => toast.warning('Third toast'), 600)
          }}
          className="px-4 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-500 transition-colors"
        >
          Show 3 Toasts
        </button>
      </div>

      <div className="pt-6 border-t border-gray-800">
        <h2 className="text-lg font-semibold text-white mb-4">Long Message</h2>
        <button
          onClick={() => toast.error(
            'Database Connection Failed',
            'Unable to connect to the database server. Please check your network connection and verify that the database service is running.'
          )}
          className="px-4 py-3 rounded-lg bg-gray-700 text-white font-medium hover:bg-gray-600 transition-colors"
        >
          Long Error Message
        </button>
      </div>
    </div>
  )
}
