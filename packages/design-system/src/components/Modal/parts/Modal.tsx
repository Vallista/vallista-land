import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { modalOverlay, modalContent, modalCloseButton } from './Modal.css'

interface ModalProps {
  active?: boolean
  onClose?: () => void
  children?: React.ReactNode
  title?: string
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
}

export const Modal = ({
  active = false,
  onClose,
  children,
  title,
  closeOnOverlayClick = true,
  closeOnEscape = true
}: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        onClose?.()
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (closeOnOverlayClick && modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose?.()
      }
    }

    // Prevent body scroll when modal is open
    const safeSetBodyStyle = (property: string, value: string) => {
      if (typeof document !== 'undefined' && document.body) {
        const style = document.body.style as CSSStyleDeclaration & { [key: string]: string }
        style[property] = value
      }
    }

    safeSetBodyStyle('overflow', 'hidden')

    document.addEventListener('keydown', handleEscape)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
      safeSetBodyStyle('overflow', '')
    }
  }, [active, onClose, closeOnOverlayClick, closeOnEscape])

  if (!active) return null

  return createPortal(
    <div className={modalOverlay}>
      <div ref={modalRef} className={modalContent}>
        {title && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{title}</h2>
            <button className={modalCloseButton} onClick={onClose} aria-label='Close modal'>
              <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                <line x1='18' y1='6' x2='6' y2='18'></line>
                <line x1='6' y1='6' x2='18' y2='18'></line>
              </svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  )
}
