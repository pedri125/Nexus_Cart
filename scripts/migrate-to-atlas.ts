import mongoose from "mongoose"

async function migrate() {
  const localUri = "mongodb://localhost:27017/nexuscart"
  const atlasUri = process.argv[2]

  console.log("--- Herramienta de Migración Local a Atlas ---\n")

  if (!atlasUri || !atlasUri.startsWith("mongodb+srv://")) {
    console.error("URL inválida. Debe comenzar con mongodb+srv://")
    process.exit(1)
  }

  try {
    console.log("\nConectando a tu base de datos local...")
    const localConn = await mongoose.createConnection(localUri).asPromise()
    const localDb = localConn.db

    console.log("Conectando a tu base de datos en la nube (Atlas)...")
    console.log("(Puede tardar unos segundos)")
    const atlasConn = await mongoose
      .createConnection(atlasUri, { dbName: "nexuscart" })
      .asPromise()
    const atlasDb = atlasConn.db

    const collections = await localDb.listCollections().toArray()
    console.log(`Se encontraron ${collections.length} colecciones para migrar.\n`)

    for (const colInfo of collections) {
      const colName = colInfo.name
      process.stdout.write(`Migrando colección: ${colName}... `)

      const data = await localDb.collection(colName).find({}).toArray()
      if (data.length > 0) {
        try {
          await atlasDb.collection(colName).drop()
        } catch (_) {
          // Colección no existía aún, OK
        }
        await atlasDb.collection(colName).insertMany(data)
        console.log(`Hecho. (${data.length} documentos insertados)`)
      } else {
        console.log(`Vacía. (0 documentos, saltando)`)
      }
    }

    console.log("\n¡Migración completada exitosamente! Todos tus datos ya están en la nube.")
    await localConn.close()
    await atlasConn.close()
  } catch (error) {
    console.error("\nError durante la migración:", error)
  } finally {
    process.exit(0)
  }
}

migrate()
