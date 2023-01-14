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
      let cn = 'w-11';
      if (iconOnly) {
        cn += ' h-11';
      }
      return cn;
    }
    if (size === 'small') {
      let cn = 'w-6';
      if (iconOnly) {
        cn += ' h-6';
      }
      return cn;
    }
    return '';
  };

  const getClassNameFromVariant = () => {
    if (variant === 'outline') {
      return 'border border-dark bg-transparent';
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
    'flex justify-center items-center transition-opacity hover:opacity-60',
    className,
  ].join(' ');

  return <button ref={ref} type="button" className={cn} {...rest} />;
});

export default Button;
