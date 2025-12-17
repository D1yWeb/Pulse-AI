'use server'

import { prismaClient } from '@/lib/prismaClient'
import { currentUser } from '@clerk/nextjs/server'
import { Prisma } from '@prisma/client'

export const onAuthenticateUser = async () => {
  try {
    const user = await currentUser()
    if (!user) {
      return { status: 403 }
    }

    const userEmail = user.emailAddresses[0]?.emailAddress
    if (!userEmail) {
      return { status: 400, error: 'No email address found' }
    }

    // First, try to find user by clerkId
    let userExist = await prismaClient.user.findUnique({
      where: {
        clerkId: user.id,
      },
      include: {
        aiAgents: true,
      },
    })

    if (userExist) {
      return {
        status: 200,
        user: userExist,
      }
    }

    // If not found by clerkId, check by email
    userExist = await prismaClient.user.findUnique({
      where: {
        email: userEmail,
      },
      include: {
        aiAgents: true,
      },
    })

    if (userExist) {
      // Update existing user with clerkId if it's missing
      if (!userExist.clerkId) {
        userExist = await prismaClient.user.update({
          where: { id: userExist.id },
          data: { clerkId: user.id },
          include: {
            aiAgents: true,
          },
        })
      }
      return {
        status: 200,
        user: userExist,
      }
    }

    // Create new user using upsert to handle race conditions
    const newUser = await prismaClient.user.upsert({
      where: {
        clerkId: user.id,
      },
      update: {
        email: userEmail,
        name: (user.firstName || '') + ' ' + (user.lastName || ''),
        profileImage: user.imageUrl || '',
      },
      create: {
        clerkId: user.id,
        email: userEmail,
        name: (user.firstName || '') + ' ' + (user.lastName || ''),
        profileImage: user.imageUrl || '',
      },
      include: {
        aiAgents: true,
      },
    })

    return { status: 201, user: newUser }
  } catch (error) {
    console.log('🔴 ERROR', error)
    
    // Handle Prisma unique constraint violation
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        // User already exists, try to find and return them
        const user = await currentUser()
        if (user) {
          const existingUser = await prismaClient.user.findFirst({
            where: {
              OR: [
                { clerkId: user.id },
                { email: user.emailAddresses[0]?.emailAddress },
              ],
            },
            include: {
              aiAgents: true,
            },
          })
          
          if (existingUser) {
            return { status: 200, user: existingUser }
          }
        }
      }
    }
    
    return { status: 500, error: 'Internal Server Error' }
  }
}
