import { execSync } from "child_process"
import fs from "fs"
import path from "path"

async function backup() {
  const databaseDir = path.join(process.cwd(), "database")
  
  // Ensure the database directory exists
  if (!fs.existsSync(databaseDir)) {
    fs.mkdirSync(databaseDir, { recursive: true })
  }

  // Generate timestamp: YYYYMMDD_HHMMSS
  const now = new Date()
  const timestamp = now.toISOString()
    .replace(/T/, "_")
    .replace(/:/g, "")
    .replace(/\..+/, "")
    .replace(/-/g, "")

  const fileName = `backup_${timestamp}.sql`
  const filePath = path.join(databaseDir, fileName)

  console.log(`Starting database backup`)
  console.log(`Destination: ${filePath}`)

  try {
    // Command to run pg_dump inside the docker container and redirect output to a file
    // We use the same credentials found in .env and docker-compose.yml
    const command = `docker exec -t budesk_db pg_dump -U budesk budesk > "${filePath}"`
    
    execSync(command, { stdio: "inherit" })
    
    console.log(`Backup completed successfully: ${fileName}`)

    // Cleanup: Keep only the 3 most recent backups
    const files = fs.readdirSync(databaseDir)
      .filter(file => file.startsWith('backup_') && file.endsWith('.sql'))
      .sort() // Names include timestamps: backup_YYYYMMDD_HHMMSS.sql
    
    if (files.length > 3) {
      const toDelete = files.slice(0, files.length - 3)
      toDelete.forEach(file => {
        const fullPath = path.join(databaseDir, file)
        fs.unlinkSync(fullPath)
        console.log(`Deleted old backup: ${file}`)
      })
    }
  } catch (error) {
    console.error(`Backup failed:`, error)
    process.exit(1)
  }
}

backup()
