import { ButtonHTMLAttributes, DetailedHTMLProps, forwardRef } from 'react';

interface ButtonProps
  extends DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  size?: 'large' | 'normal' | 'small';
  variant?: 'outline' | 'solid';
  iconOnly?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const {
    size = 'normal',
    variant = 'outline',
    iconOnly = true,
    className = '',
    ...rest
  } = props;

  const getClassNameFromSize = () => {
    if (size === 'normal') {
      if (iconOnly) {
        return 'w-11 h-11';
      }
      return 'px-3 py-2 rounded-md';
    }
    if (size === 'small') {
      if (iconOnly) {
        return 'w-6 h-6';
      }
      return 'px-2 py-1 text-xs rounded-sm';
    }
    return '';
  };

  const getClassNameFromVariant = () => {
    if (variant === 'outline') {
      return 'border border-dark bg-transparent hover:opacity-60 focus:opacity-60';
    }
    return '';
  };

  const getClassNameFromIconOnly = () => {
    if (iconOnly) {
      return 'rounded-full';
    }
    return '';
  };

  const cn = [
    getClassNameFromSize(),
    getClassNameFromVariant(),
    getClassNameFromIconOnly(),
    'flex justify-center items-center transition-opacity',
    className,
  ].join(' ');

  return <button ref={ref} className={cn} {...rest} />;
});

export default Button;
