// GET / PUT / DELETE  /api/mock/records/12
import { NextResponse } from "next/server";
import { getTable } from "../../store";

type Ctx = { params: Promise<{ resource: string; id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { resource, id } = await ctx.params;
  const row = getTable(resource)?.find((r) => r.id === id);
  if (!row) return NextResponse.json("Not found", { status: 404 });
  return NextResponse.json(row);
}

// PUT แบบ MockAPI = แก้เฉพาะฟิลด์ที่ส่งมา ฟิลด์อื่นคงเดิม
export async function PUT(request: Request, ctx: Ctx) {
  const { resource, id } = await ctx.params;
  const table = getTable(resource);
  const index = table ? table.findIndex((r) => r.id === id) : -1;
  if (!table || index === -1) return NextResponse.json("Not found", { status: 404 });

  const body = await request.json();
  table[index] = { ...table[index], ...body, id };
  return NextResponse.json(table[index]);
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { resource, id } = await ctx.params;
  const table = getTable(resource);
  const index = table ? table.findIndex((r) => r.id === id) : -1;
  if (!table || index === -1) return NextResponse.json("Not found", { status: 404 });

  const [removed] = table.splice(index, 1);
  return NextResponse.json(removed);
}
