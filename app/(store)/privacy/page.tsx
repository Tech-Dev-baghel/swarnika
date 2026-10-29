import InfoPage, { infoMeta } from "@/components/InfoPage";
export const generateMetadata = () => infoMeta("privacy");
export default function Page() { return <InfoPage slug="privacy" />; }
