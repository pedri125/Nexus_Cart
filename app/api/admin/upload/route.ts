import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"

export async function POST(request: Request) {
  // Vercel's filesystem is read-only — file uploads to disk won't persist
  if (process.env.VERCEL) {
    return NextResponse.json(
      {
        error:
          "La subida de archivos al disco no está disponible en producción. " +
          "Usa un servicio de almacenamiento en la nube (Firebase Storage, Cloudinary, etc.).",
      },
      { status: 501 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get("image") as File | null
    if (!file) {
      return NextResponse.json({ error: "No se recibió ninguna imagen." }, { status: 400 })
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
    const allowed = ["jpg", "jpeg", "png", "webp", "gif", "avif"]
    if (!allowed.includes(ext)) {
      return NextResponse.json({ error: "Formato de imagen no soportado." }, { status: 400 })
    }

    const filename = `${randomUUID()}.${ext}`
    const uploadDir = path.join(process.cwd(), "public", "uploads")
    await mkdir(uploadDir, { recursive: true })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(path.join(uploadDir, filename), buffer)

    return NextResponse.json({ url: `/uploads/${filename}` }, { status: 201 })
  } catch (e: any) {
    console.error("POST /api/admin/upload", e)
    return NextResponse.json({ error: "Error al subir la imagen." }, { status: 500 })
  }
}
