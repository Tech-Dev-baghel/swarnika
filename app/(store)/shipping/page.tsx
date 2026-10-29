import InfoPage, { infoMeta } from "@/components/InfoPage";
export const generateMetadata = () => infoMeta("shipping");
export default function Page() { return <InfoPage slug="shipping" />; }
