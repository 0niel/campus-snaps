import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "This endpoint is only available in development mode" },
      { status: 403 },
    );
  }

  try {
    const email = request.nextUrl.searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 },
      );
    }

    console.log(`Fetching verification token for email: ${email}`);

    const verificationToken = await db.verificationToken.findFirst({
      where: { identifier: email },
      orderBy: { createdAt: "desc" },
    });

    if (!verificationToken) {
      console.log(`No verification token found for email: ${email}`);
      return NextResponse.json(
        { error: "No verification code found for this email" },
        { status: 404 },
      );
    }

    console.log(`Found token: ${verificationToken.token.substring(0, 6)}`);

    return NextResponse.json({
      code: verificationToken.token,
      expires: verificationToken.expires,
    });
  } catch (error) {
    console.error("Error fetching auth code:", error);
    return NextResponse.json(
      { error: "Failed to fetch verification code" },
      { status: 500 },
    );
  }
}
