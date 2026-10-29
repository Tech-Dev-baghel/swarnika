import InfoPage, { infoMeta } from "@/components/InfoPage";
export const generateMetadata = () => infoMeta("about");
export default function Page() { return <InfoPage slug="about" />; }
