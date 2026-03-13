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
    const body = await req.json()
    
    if (body.parameters && Array.isArray(body.parameters)) {
      const results = []
      for (const param of body.parameters) {
        if (param.key && param.value !== undefined) {
          const result = await PlantingParameterService.setParameter(param.key, String(param.value), param.description)
          results.push(result)
        }
      }
      return NextResponse.json(results)
    }

    const { key, value, description } = body
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
