'use client'

import { useState } from 'react'
import { toast } from 'sonner'

// Method 1: Using the CSRF hook directly
import { useCSRF } from '@/hooks/use-csrf'

// Method 2: Using the secure fetch utilities
import { secureFetch, secureApi } from '@/lib/security/secure-fetch'

// Method 3: Using the CSRF form component
import { CSRFForm } from '@/components/security/csrf-form'

/**
 * Example 1: Using the CSRF hook with manual fetch
 */
function ExampleWithHook() {
  const { getHeaders } = useCSRF()
  const [name, setName] = useState('')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/portfolios', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name }),
      })
      
      if (!response.ok) throw new Error('Failed to create portfolio')
      
      const data = await response.json()
      toast.success('Portfolio created successfully')
    } catch (error) {
      toast.error('Failed to create portfolio')
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Portfolio name"
        required
      />
      <button type="submit">Create Portfolio</button>
    </form>
  )
}

/**
 * Example 2: Using secureFetch for automatic CSRF handling
 */
function ExampleWithSecureFetch() {
  const [name, setName] = useState('')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // secureFetch automatically includes CSRF token
      const response = await secureFetch('/api/portfolios', {
        method: 'POST',
        body: JSON.stringify({ name }),
      })
      
      if (!response.ok) throw new Error('Failed to create portfolio')
      
      const data = await response.json()
      toast.success('Portfolio created successfully')
    } catch (error) {
      toast.error('Failed to create portfolio')
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Portfolio name"
        required
      />
      <button type="submit">Create Portfolio</button>
    </form>
  )
}

/**
 * Example 3: Using type-safe secureApi wrapper
 */
interface Portfolio {
  id: string
  name: string
  currency: string
}

function ExampleWithSecureApi() {
  const [name, setName] = useState('')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Type-safe API call with automatic CSRF protection
    const { data, error } = await secureApi<{ portfolio: Portfolio }>('/api/portfolios', {
      method: 'POST',
      body: { name },
    })
    
    if (error) {
      toast.error(error)
    } else {
      toast.success(`Portfolio "${data?.portfolio.name}" created successfully`)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Portfolio name"
        required
      />
      <button type="submit">Create Portfolio</button>
    </form>
  )
}

/**
 * Example 4: Using CSRFForm component
 */
function ExampleWithCSRFForm() {
  return (
    <CSRFForm 
      onSubmit={async (e, csrfToken) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        
        try {
          const response = await fetch('/api/portfolios', {
            method: 'POST',
            headers: {
              'X-CSRF-Token': csrfToken || '',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: formData.get('name'),
            }),
          })
          
          if (!response.ok) throw new Error('Failed to create portfolio')
          
          toast.success('Portfolio created successfully')
        } catch (error) {
          toast.error('Failed to create portfolio')
        }
      }}
    >
      <input name="name" placeholder="Portfolio name" required />
      <button type="submit">Create Portfolio</button>
    </CSRFForm>
  )
}

/**
 * Example 5: Handling DELETE requests with CSRF
 */
function ExampleDeleteWithCSRF() {
  const { getHeaders } = useCSRF()
  
  const handleDelete = async (portfolioId: string) => {
    if (!confirm('Are you sure you want to delete this portfolio?')) return
    
    try {
      // Method 1: Using hook
      const response = await fetch(`/api/portfolios/${portfolioId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      })
      
      // Method 2: Using secureFetch (alternative)
      // const response = await secureFetch(`/api/portfolios/${portfolioId}`, {
      //   method: 'DELETE',
      // })
      
      if (!response.ok) throw new Error('Failed to delete portfolio')
      
      toast.success('Portfolio deleted successfully')
    } catch (error) {
      toast.error('Failed to delete portfolio')
    }
  }
  
  return (
    <button onClick={() => handleDelete('portfolio-123')}>
      Delete Portfolio
    </button>
  )
}

// Export all examples
export {
  ExampleWithHook,
  ExampleWithSecureFetch,
  ExampleWithSecureApi,
  ExampleWithCSRFForm,
  ExampleDeleteWithCSRF,
}