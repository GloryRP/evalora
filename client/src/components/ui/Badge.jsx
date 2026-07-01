/**
 * Badge Component
 * Reusable badge for status indicators, role labels, etc.
 */

const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    gold: 'bg-amber-50 text-amber-800 border border-amber-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    error: 'bg-red-50 text-red-700 border border-red-200',
    navy: 'bg-indigo-50 text-indigo-800 border border-indigo-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
