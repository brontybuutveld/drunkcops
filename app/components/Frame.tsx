
export function Frame({className = '', children}: {className?: string, children: React.ReactNode}) {
  return (
    <div className={`bg-gray-50 m-10px border-2 rounded-lg border-gray-400 p-2 ${className}`}>{children}</div>
  )
}