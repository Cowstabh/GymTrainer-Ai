export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getUserProfile, saveUserProfile } from "@/lib/dynamodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id || session.user.name || session.user.email;
    const profile = await getUserProfile(userId);
    
    return NextResponse.json({ profile: profile?.bioData || null });
  } catch (error) {
    console.error("Fetch profile error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id || session.user.name || session.user.email;
    const { bioData } = await req.json();

    if (!bioData) {
      return NextResponse.json({ error: "Missing bioData" }, { status: 400 });
    }

    await saveUserProfile(userId, bioData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save profile error:", error);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
