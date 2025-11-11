export default function SettingsLoading() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mt-2"></div>
        </div>

        <div className="h-12 w-full bg-gray-200 rounded animate-pulse mb-4"></div>

        <div className="space-y-4">
          <div className="h-64 w-full bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}
