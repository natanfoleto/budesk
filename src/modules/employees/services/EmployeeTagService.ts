import { EmployeeTag } from "@prisma/client"

import prisma from "@/lib/prisma"

export class EmployeeTagService {
  /**
   * List all global tags
   */
  static async list() {
    return prisma.employeeTag.findMany({
      orderBy: { name: "asc" }
    })
  }

  /**
   * Create a new global tag
   */
  static async create(data: { name: string; color: string }) {
    // Check if name already exists
    const existing = await prisma.employeeTag.findUnique({
      where: { name: data.name }
    })

    if (existing) {
      throw new Error(`A etiqueta "${data.name}" já existe.`)
    }

    return prisma.employeeTag.create({
      data: {
        name: data.name.trim(),
        color: data.color
      }
    })
  }

  /**
   * Update a global tag
   */
  static async update(id: string, data: { name?: string; color?: string; employeeIds?: string[] }) {
    return prisma.$transaction(async (tx) => {
      if (data.name) {
        const existing = await tx.employeeTag.findFirst({
          where: { 
            name: data.name.trim(),
            id: { not: id }
          }
        })

        if (existing) {
          throw new Error(`Outra etiqueta com o nome "${data.name}" já existe.`)
        }
      }

      const tag = await tx.employeeTag.update({
        where: { id },
        data: {
          name: data.name?.trim(),
          color: data.color
        }
      })

      // Sync employees if provided
      if (data.employeeIds) {
        // Remove existing
        await tx.employeeTagOnEmployee.deleteMany({
          where: { tagId: id }
        })

        // Add new
        if (data.employeeIds.length > 0) {
          await tx.employeeTagOnEmployee.createMany({
            data: data.employeeIds.map(employeeId => ({
              tagId: id,
              employeeId
            }))
          })
        }
      }

      return tag
    })
  }

  /**
   * Delete a global tag
   */
  static async delete(id: string) {
    return prisma.employeeTag.delete({
      where: { id }
    })
  }

  /**
   * Get tags for a specific employee
   */
  static async getEmployeeTags(employeeId: string) {
    const employeeWithTags = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    return employeeWithTags?.tags.map((t: { tag: EmployeeTag }) => t.tag) || []
  }

  /**
   * Sync tags for a specific employee (replaces current tags with new set)
   */
  static async syncEmployeeTags(employeeId: string, tagIds: string[]) {
    return prisma.$transaction(async (tx) => {
      // Remove all existing associations
      await tx.employeeTagOnEmployee.deleteMany({
        where: { employeeId }
      })

      // Create new associations
      if (tagIds.length > 0) {
        await tx.employeeTagOnEmployee.createMany({
          data: tagIds.map((tagId) => ({
            employeeId,
            tagId
          }))
        })
      }

      // Return refreshed tags
      const updated = await tx.employee.findUnique({
        where: { id: employeeId },
        include: {
          tags: {
            include: {
              tag: true
            }
          }
        }
      })

      return updated?.tags.map((t: { tag: EmployeeTag }) => t.tag) || []
    })
  }
}
