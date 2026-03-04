export default function PlaceholderTab({ title }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <p className="text-lg text-white">{title}</p>
      <p className="mt-2 text-sm text-gray-400">Coming soon</p>
    </div>
  )
}
