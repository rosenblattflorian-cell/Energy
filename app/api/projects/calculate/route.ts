
import { NextResponse } from "next/server";
import { runPipeline } from "../../../../lib/pipeline/enginePipeline";

export async function POST(req:Request){
  const body = await req.json();
  const result = runPipeline(body);
  return NextResponse.json(result);
}
