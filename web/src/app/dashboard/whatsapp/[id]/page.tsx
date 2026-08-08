import PageClient from "./PageClient";

// Static export requires generateStaticParams for dynamic segments (no server exists at
// request time to render unknown ids on-demand). This id is never actually rendered from —
// PageClient reads the real id client-side via useParams(), so any id resolves correctly once
// staticwebapp.config.json rewrites unmatched requests here.
export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function Page() {
  return <PageClient />;
}
