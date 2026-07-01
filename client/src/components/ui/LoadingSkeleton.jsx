/**
 * LoadingSkeleton Component
 * Clean skeleton loader for tables and content
 */

const LoadingSkeleton = ({ rows = 5, columns = 6 }) => {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <div
              key={j}
              className={`h-10 bg-gray-200 rounded ${
                j === 0 ? 'w-32' : j === columns - 1 ? 'w-24' : 'flex-1'
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
