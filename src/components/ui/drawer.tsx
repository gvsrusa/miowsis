'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

interface DrawerProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

interface DrawerContentProps {
  children: React.ReactNode
  className?: string
  side?: 'left' | 'right' | 'top' | 'bottom'
}

interface DrawerChildProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function Drawer({ open, onOpenChange, children }: DrawerProps) {
  return (
    <div>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<DrawerChildProps>, {
            open,
            onOpenChange,
          })
        }
        return child
      })}
    </div>
  )
}

interface DrawerTriggerChildProps {
  onClick?: (event: React.MouseEvent) => void
}

export function DrawerTrigger({ 
  children, 
  asChild = false,
  onOpenChange 
}: { 
  children: React.ReactNode
  asChild?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const handleClick = () => {
    onOpenChange?.(true)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<DrawerTriggerChildProps>, {
      onClick: handleClick,
    })
  }

  return (
    <button onClick={handleClick}>
      {children}
    </button>
  )
}

export function DrawerContent({ 
  children, 
  className,
  side = 'right',
  open,
  onOpenChange
}: DrawerContentProps & { 
  open?: boolean
  onOpenChange?: (open: boolean) => void 
}) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  const sideClasses = {
    left: 'left-0 top-0 h-full',
    right: 'right-0 top-0 h-full',
    top: 'top-0 left-0 w-full',
    bottom: 'bottom-0 left-0 w-full',
  }

  const translateClasses = {
    left: '-translate-x-full data-[state=open]:translate-x-0',
    right: 'translate-x-full data-[state=open]:translate-x-0',
    top: '-translate-y-full data-[state=open]:translate-y-0',
    bottom: 'translate-y-full data-[state=open]:translate-y-0',
  }

  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => onOpenChange?.(false)}
      />
      <div
        className={cn(
          'fixed z-50 bg-background p-6 shadow-lg transition-transform duration-300',
          sideClasses[side],
          translateClasses[side],
          side === 'left' || side === 'right' ? 'w-[85vw] max-w-sm' : 'max-h-[85vh]',
          className
        )}
        data-state={open ? 'open' : 'closed'}
      >
        {children}
      </div>
    </>
  )
}

export function DrawerHeader({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  )
}

export function DrawerTitle({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <h2 className={cn('text-lg font-semibold', className)}>
      {children}
    </h2>
  )
}

export function DrawerDescription({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)}>
      {children}
    </p>
  )
}