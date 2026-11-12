// GET /api/mock/records?kind=order  และ  POST /api/mock/records
import { NextResponse } from "next/server";
import { getTable, nextId } from "../store";

type Ctx = { params: Promise<{ resource: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const { resource } = await ctx.params;
  const table = getTable(resource);
  if (!table) return NextResponse.json("Not found", { status: 404 });

  // กรองด้วย query เช่น ?kind=order&userId=2 (เทียบค่าแบบตรงตัว)
  const query = new URL(request.url).searchParams;
  let rows = table;
  query.forEach((value, key) => {
    rows = rows.filter((row) => String(row[key] ?? "") === value);
  });
  return NextResponse.json(rows);
}

export async function POST(request: Request, ctx: Ctx) {
  const { resource } = await ctx.params;
  const table = getTable(resource);
  if (!table) return NextResponse.json("Not found", { status: 404 });

  const body = await request.json();
  const row = { ...body, id: nextId(table) };
  table.push(row);
  return NextResponse.json(row, { status: 201 });
}
