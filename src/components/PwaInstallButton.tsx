import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'

export function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsVisible(false)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    // @ts-expect-error - beforeinstallprompt event has prompt method
    deferredPrompt.prompt()

    // @ts-expect-error
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsVisible(false)
    }
    setDeferredPrompt(null)
  }

  if (!isVisible) return null

  return (
    <button
      onClick={handleInstall}
      className="fixed bottom-4 right-4 z-50 bg-primary text-on-primary px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-label-md hover:bg-primary-container transition-colors"
    >
      <Download size={18} />
      <span>添加到主屏幕</span>
    </button>
  )
}
