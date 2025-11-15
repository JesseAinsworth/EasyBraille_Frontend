// Backend API Configuration
export const getBackendUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || "https://easybraillebackend-production.up.railway.app"
}

// Helper function for API calls with proper error handling
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const backendUrl = getBackendUrl()
  const url = `${backendUrl}${endpoint}`
  
  console.log(`🔄 API Call: ${options.method || 'GET'} ${url}`)
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  
  // Check if response is HTML instead of JSON
  const contentType = response.headers.get("content-type")
  if (!contentType || !contentType.includes("application/json")) {
    const errorText = await response.text()
    console.error("Backend returned HTML instead of JSON:", errorText.substring(0, 200))
    throw new Error("Error de conexión con el servidor. Por favor, intenta más tarde.")
  }
  
  const data = await response.json()
  
  if (!response.ok) {
    console.error(`❌ API Error (${response.status}):`, data)
    throw new Error(data.message || data.error || 'Error en el servidor')
  }
  
  return { data, response }
}