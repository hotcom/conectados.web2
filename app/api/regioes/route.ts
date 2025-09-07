import { NextResponse } from "next/server"
import { regioesFC } from "@/data/regioes"
import { ufsFC } from "@/data/ufs"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const layer = (searchParams.get("layer") || "").toLowerCase()
  if (layer === "regioes") return NextResponse.json(regioesFC)
  if (layer === "ufs") return NextResponse.json(ufsFC)
  return NextResponse.json({ error: "Use ?layer=regioes ou ?layer=ufs" }, { status: 400 })
}
