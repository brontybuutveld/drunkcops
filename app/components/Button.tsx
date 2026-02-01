export function Button({onClick, ref, id, children}: {onClick: () => void, ref?: React.Ref<HTMLButtonElement>, id?: string, children: React.ReactNode}) {
  return (
    <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mx-1 my-1"
    onClick={onClick} ref={ref} id={id}>{children}</button>
  )
}