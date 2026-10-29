import InfoPage, { infoMeta } from "@/components/InfoPage";
type P = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: P) { return infoMeta((await params).slug); }
export default async function Page({ params }: P) { return <InfoPage slug={(await params).slug} />; }
