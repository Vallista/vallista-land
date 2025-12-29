import { forwardRef } from 'react'

import { InputProps } from './type'
import { useInput } from './useInput'
import { inputBox, inputContainer, inputInner, inputSide } from './Input.css'

/**
 * # Input
 *
 * 인풋 컴포넌트.
 *
 * @param {SearchInputProps} {@link InputProps} 인풋 파라미터
 *
 * @example ```tsx
 * <Input size='small' placeholder='search...' disabled />
 * <Input size='small' prefix={<Icon.Activity />} placeholder='search...' prefixStyling={false} disabled />
 * <Input size='small' suffix={<Icon.Activity />} placeholder='search...' suffixStyling={false} disabled />
 * <Input
 *   size='large'
 *   prefix={<Icon.Activity />}
 *   suffix={<Icon.Activity />}
 *   placeholder='search...'
 *   prefixStyling={false}
 *   suffixStyling={false}
 *   disabled
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, Partial<InputProps>>((props, ref) => {
  const {
    size = 'medium',
    suffixStyling = true,
    prefixStyling = true,
    disabled = false,
    prefix,
    suffix,
    placeholder,
    value,
    onChange,
    type = 'text',
    name,
    id,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedby,
    'aria-invalid': ariaInvalid,
    required = false,
    autoComplete,
    autoFocus = false,
    readOnly = false,
    maxLength,
    minLength,
    pattern,
    ...otherProps
  } = useInput(props)

  return (
    <div className={inputContainer()}>
      <div className={inputBox()}>
        {prefix && (
          <span
            className={inputSide({
              size,
              position: 'prefix',
              styling: prefixStyling ? 'styled' : 'unstyled'
            })}
            aria-hidden='true'
          >
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          className={inputInner({ size })}
          type={type}
          name={name}
          id={id}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedby}
          aria-invalid={ariaInvalid}
          required={required}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          readOnly={readOnly}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          placeholder={placeholder}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange?.(e.currentTarget.value)}
          {...otherProps}
        />
        {suffix && (
          <span
            className={inputSide({
              size,
              position: 'suffix',
              styling: suffixStyling ? 'styled' : 'unstyled'
            })}
            aria-hidden='true'
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
})
