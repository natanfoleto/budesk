import { NextResponse } from "next/server"

import { PlantingParameterService } from "@/src/modules/planting/services/PlantingParameterService"

export async function GET() {
  try {
    const parameters = await PlantingParameterService.getAllParameters()
    return NextResponse.json(parameters)
  } catch (error) {
    console.error("Error fetching parameters:", error)
    return NextResponse.json({ error: "Failed to fetch parameters" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { key, value, description } = await req.json()
    if (!key || value === undefined) {
      return NextResponse.json({ error: "Key and value are required" }, { status: 400 })
    }
    
    const parameter = await PlantingParameterService.setParameter(key, String(value), description)
    return NextResponse.json(parameter)
  } catch (error) {
    console.error("Error setting parameter:", error)
    return NextResponse.json({ error: "Failed to set parameter" }, { status: 500 })
  }
}
