export async function translateBrailleImage(file: File) {
  const formData = new FormData();
  formData.append("image", file);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://easybraille-backend.onrender.com"

  const res = await fetch(`${API_URL}/api/image-translate`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Error al traducir la imagen.");
  return res.json();
}
