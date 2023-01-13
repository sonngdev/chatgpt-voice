import { forwardRef, ReactNode } from 'react';

interface ButtonProps {
  size?: 'large' | 'normal' | 'small';
  variant?: 'outline' | 'solid';
  iconOnly?: boolean;
  children: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const {
    size = 'normal',
    variant = 'outline',
    iconOnly = true,
    children,
  } = props;

  const getClassNameFromSize = () => {
    if (size === 'normal') {
      let cn = 'w-11';
      if (iconOnly) {
        cn += ' h-11';
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

  const className = [
    getClassNameFromSize(),
    getClassNameFromVariant(),
    getClassNameFromIconOnly(),
  ].join(' ');

  return (
    <button
      ref={ref}
      type="button"
      className={`${className} flex justify-center items-center`}
    >
      {children}
    </button>
  );
});

export default Button;
