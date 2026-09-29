export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ message: "API running" }, { status: 200 });
}
