import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";
import { fileTypeFromBuffer } from "file-type";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.",
        },
        { status: 400 }
      );
    }

    // Validate file size (e.g., max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size too large. Max 2MB allowed." },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Verify file signature (Magic Numbers)
    const fileTypeResult = await fileTypeFromBuffer(buffer);
    if (!fileTypeResult || !validTypes.includes(fileTypeResult.mime)) {
      return NextResponse.json(
        {
          error:
            "Security Alert: File content does not match the allowed image types.",
        },
        { status: 400 }
      );
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
          folder: "profile_pics",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({ url: result.secure_url }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
