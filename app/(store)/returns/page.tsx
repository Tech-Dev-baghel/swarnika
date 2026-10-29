import InfoPage, { infoMeta } from "@/components/InfoPage";
export const generateMetadata = () => infoMeta("returns");
export default function Page() { return <InfoPage slug="returns" />; }
