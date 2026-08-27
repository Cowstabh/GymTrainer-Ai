import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getWorkoutPlan } from "@/lib/dynamodb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.email || session.user.name || "user_123"; // Using email or name as id based on auth config, falling back to mock

    const currentPlan = await getWorkoutPlan(userId);

    if (!currentPlan) {
      return NextResponse.json({ plan: null }, { status: 200 });
    }

    return NextResponse.json({ plan: currentPlan }, { status: 200 });
  } catch (error) {
    console.error("Error fetching current workout plan:", error);
    return NextResponse.json({ error: "Failed to fetch plan" }, { status: 500 });
  }
}
