import InfoPage, { infoMeta } from "@/components/InfoPage";
export const generateMetadata = () => infoMeta("terms");
export default function Page() { return <InfoPage slug="terms" />; }
