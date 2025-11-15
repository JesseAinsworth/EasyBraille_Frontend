export async function translateBrailleImage(file: File) {
  const formData = new FormData();
  formData.append("image", file);
  // Read backend URL from NEXT_PUBLIC_API_URL (set this in your environment / hosting)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://easybraillebackend-production.up.railway.app";

  // Use the official backend endpoint for image translation
  const res = await fetch(`${API_URL}/api/braille-image`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error(`Error al traducir la imagen: ${res.status} ${res.statusText}`);
  return res.json();
}
