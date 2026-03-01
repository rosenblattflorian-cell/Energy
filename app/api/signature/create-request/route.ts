import { NextResponse } from "next/server";

const FUNCTION_BASE_URL = process.env.FUNCTIONS_BASE_URL;

export async function POST(request: Request) {
  if (!FUNCTION_BASE_URL) {
    return NextResponse.json({ error: "Missing FUNCTIONS_BASE_URL" }, { status: 500 });
  }

  const response = await fetch(`${FUNCTION_BASE_URL}/createSignatureRequest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });

  return NextResponse.json(await response.json(), { status: response.status });
}
