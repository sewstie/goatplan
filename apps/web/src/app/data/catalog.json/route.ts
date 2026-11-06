import catalog from "../../../../../../data/catalog.json";

export function GET() {
  return Response.json(catalog);
}
