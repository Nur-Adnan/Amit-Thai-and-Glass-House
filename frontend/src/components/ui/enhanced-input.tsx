"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/LanguageContext"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
  description?: string
  required?: boolean
}

const EnhancedInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, description, required, id, ...props }, ref) => {
    const { language, t } = useLanguage()
    const generatedId = React.useId()
    const inputId = id || generatedId
    const errorId = `${inputId}-error`
    const descriptionId = `${inputId}-description`

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={inputId}
            className={cn(
              "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              language === 'bn' && "font-bengali"
            )}
          >
            {label}
            {required && <span className="text-destructive ml-1" aria-label={t('required')}>*</span>}
          </label>
        )}
        
        {description && (
          <p 
            id={descriptionId}
            className={cn(
              "text-sm text-muted-foreground",
              language === 'bn' && "font-bengali"
            )}
          >
            {description}
          </p>
        )}
        
        <input
          type={type}
          id={inputId}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
            language === 'bn' && "font-bengali py-2.5",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          ref={ref}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={cn(
            description && descriptionId,
            error && errorId
          )}
          {...props}
        />
        
        {error && (
          <p 
            id={errorId}
            role="alert"
            className={cn(
              "text-sm font-medium text-destructive",
              language === 'bn' && "font-bengali"
            )}
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)
EnhancedInput.displayName = "EnhancedInput"

export { EnhancedInput }