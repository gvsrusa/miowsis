'use client'

import { type FormEvent, type ReactNode } from 'react'
import { useCSRF } from '@/hooks/use-csrf'

interface CSRFFormProps {
  children: ReactNode
  onSubmit: (event: FormEvent<HTMLFormElement>, csrfToken: string | null) => void | Promise<void>
  className?: string
}

/**
 * Form component that automatically handles CSRF tokens
 * 
 * @example
 * ```tsx
 * <CSRFForm onSubmit={async (e, csrfToken) => {
 *   e.preventDefault()
 *   const formData = new FormData(e.currentTarget)
 *   
 *   const response = await fetch('/api/data', {
 *     method: 'POST',
 *     headers: {
 *       'X-CSRF-Token': csrfToken || '',
 *       'Content-Type': 'application/json'
 *     },
 *     body: JSON.stringify({
 *       name: formData.get('name')
 *     })
 *   })
 * }}>
 *   <input name="name" />
 *   <button type="submit">Submit</button>
 * </CSRFForm>
 * ```
 */
export function CSRFForm({ children, onSubmit, className }: CSRFFormProps) {
  const { csrfToken, isLoading } = useCSRF()
  
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    // Don't submit if CSRF token is still loading
    if (isLoading) {
      event.preventDefault()
      console.warn('CSRF token is still loading')
      return
    }
    
    await onSubmit(event, csrfToken)
  }
  
  return (
    <form onSubmit={handleSubmit} className={className}>
      {/* Hidden input for traditional form submissions */}
      {csrfToken && (
        <input type="hidden" name="_csrf" value={csrfToken} />
      )}
      {children}
    </form>
  )
}

/**
 * Hook to get form props with CSRF token included
 * 
 * @example
 * ```tsx
 * const { formProps, csrfToken } = useCSRFForm()
 * 
 * <form {...formProps} onSubmit={(e) => {
 *   e.preventDefault()
 *   // Use csrfToken in your submission logic
 * }}>
 * ```
 */
export function useCSRFForm() {
  const { csrfToken, isLoading, getHeaders } = useCSRF()
  
  return {
    formProps: {
      'data-csrf': csrfToken || undefined,
    },
    csrfToken,
    isLoading,
    getHeaders,
  }
}