'use client'

import { useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface LightboxProps {
  images: string[]
  isOpen: boolean
  currentIndex: number
  onClose: () => void
  onNext: () => void
  onPrev: () => void
}

export function Lightbox({ images, isOpen, currentIndex, onClose, onNext, onPrev }: LightboxProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
      >
        <X size={24} className="text-white" />
      </button>

      <button
        onClick={onPrev}
        className="absolute left-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
        disabled={images.length <= 1}
      >
        <ChevronLeft size={24} className="text-white" />
      </button>

      <div className="relative w-full h-full flex items-center justify-center px-12">
        <img
          src={images[currentIndex]}
          alt={`Image ${currentIndex + 1}`}
          className="max-w-full max-h-[90vh] object-contain"
        />
      </div>

      <button
        onClick={onNext}
        className="absolute right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
        disabled={images.length <= 1}
      >
        <ChevronRight size={24} className="text-white" />
      </button>

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  )
}
