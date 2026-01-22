import { jwtVerify,SignJWT } from "jose"

import { JWTPayload } from "./types"

const SECRET_KEY = process.env.JWT_SECRET || "supersecretkeyshouldbechangedsomeday"
const key = new TextEncoder().encode(SECRET_KEY)

export async function signJWT(payload: JWTPayload, expiresIn: string = "1d") {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key)
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    })
    return payload as unknown as JWTPayload
  } catch (_error) {
    return null
  }
}
