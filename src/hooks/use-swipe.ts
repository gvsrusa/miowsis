import { useRef, useEffect, useCallback } from 'react'

interface SwipeHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
}

interface SwipeOptions {
  threshold?: number
  preventDefaultTouchmoveEvent?: boolean
}

export function useSwipe(
  handlers: SwipeHandlers,
  options: SwipeOptions = {}
) {
  const { threshold = 50, preventDefaultTouchmoveEvent = false } = options
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const touchEndX = useRef(0)
  const touchEndY = useRef(0)

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX
    touchStartY.current = e.targetTouches[0].clientY
  }

  const handleTouchMove = useCallback((e: TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
    touchEndY.current = e.targetTouches[0].clientY
    
    if (preventDefaultTouchmoveEvent) {
      e.preventDefault()
    }
  }, [preventDefaultTouchmoveEvent])

  const handleTouchEnd = useCallback(() => {
    if (!touchStartX.current || !touchEndX.current) return

    const deltaX = touchStartX.current - touchEndX.current
    const deltaY = touchStartY.current - touchEndY.current
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    // Horizontal swipe
    if (absX > absY && absX > threshold) {
      if (deltaX > 0) {
        handlers.onSwipeLeft?.()
      } else {
        handlers.onSwipeRight?.()
      }
    }

    // Vertical swipe
    if (absY > absX && absY > threshold) {
      if (deltaY > 0) {
        handlers.onSwipeUp?.()
      } else {
        handlers.onSwipeDown?.()
      }
    }
  }, [handlers, threshold])

  useEffect(() => {
    const element = document.body

    element.addEventListener('touchstart', handleTouchStart)
    element.addEventListener('touchmove', handleTouchMove)
    element.addEventListener('touchend', handleTouchEnd)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchMove, handleTouchEnd])

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  }
}