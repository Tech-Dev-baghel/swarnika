import InfoPage, { infoMeta } from "@/components/InfoPage";
export const generateMetadata = () => infoMeta("faq");
export default function Page() { return <InfoPage slug="faq" />; }
