import { NextRequest, NextResponse } from "next/server";
import { uploadToS3 } from "@/lib/s3";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("video") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("video/")) {
      return NextResponse.json({ error: "File must be a video" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3 and get the temporary signed URL
    const { key, url } = await uploadToS3(buffer, file.name, file.type);

    return NextResponse.json({ success: true, key, url });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json(
      { error: "Failed to upload video", details: error.message },
      { status: 500 }
    );
  }
}
