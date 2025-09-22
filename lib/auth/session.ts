import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey = process.env.JWT_SECRET;
if (!secretKey) {
  throw new Error("JWT_SECRET is not defined");
}

const encodedKey = new TextEncoder().encode(secretKey);

type SessionPayload = {
  userId: string;
  userName: string;
  role: string;

  expiresAt: number;
};

export async function createSession(
  userId: string,
  userName: string,
  role: string,
  remember: string
) {
  const expiresAt =
    remember === "on"
      ? new Date(Date.now() + 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 12 * 60 * 60 * 1000);

  const session = await Encrypt({
    userId,
    userName,
    role,

    expiresAt: expiresAt.getTime(),
  });

  (await cookies()).set("session", session, {
    expires: expiresAt,
  });
}

export async function Encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(payload.expiresAt / 1000))
    .sign(encodedKey);
}
export async function Decrypt(session: string | undefined = "") {
  try {
    if (
      !session ||
      typeof session !== "string" ||
      session.split(".").length !== 3
    ) {
      return null;
    }
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    console.error("Failed to verify session:", error);
  }
}

export async function deleteSession() {
  (await cookies()).delete("session");
}
export async function getCookies(cookieName: string) {
  return (await cookies()).get(cookieName)?.value;
}
export async function setCookies(
  cookieName: string,
  value: any,
  expiresAt: Date
) {
  (await cookies()).set("session", value, {
    expires: expiresAt,
    secure: true,
    httpOnly: true,
  });
}
