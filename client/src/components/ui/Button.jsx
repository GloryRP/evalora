/**
 * Button Component
 * Reusable button with variants matching the design system
 */

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  onClick,
  className = '',
}) => {
  const baseStyles = 'font-medium rounded-lg transition-all duration-150 focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-[#1E3A5F] text-white hover:bg-[#152B45] focus:ring-[#1E3A5F]',
    gold: 'bg-[#C9A227] text-white hover:bg-[#B39320] focus:ring-[#C9A227]',
    secondary: 'bg-white text-[#1E3A5F] border border-[#1E3A5F] hover:bg-gray-50 focus:ring-[#1E3A5F]',
    ghost: 'bg-transparent text-[#5C5C5C] hover:bg-gray-100 focus:ring-gray-300',
    danger: 'bg-[#B3413E] text-white hover:bg-[#9A3633] focus:ring-[#B3413E]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
