import { SettingsForm } from "@/components/admin/Managers";
import { adminPage } from "@/lib/admin-guard";
import { getRates, getSettings } from "@/lib/db";
import { dtdcEnabled, dtdcTrackingEnabled } from "@/lib/dtdc";
import { razorpayEnabled, razorpayTestMode } from "@/lib/razorpay";
import { SITE_URL } from "@/lib/site";

export default async function Page() {
  await adminPage("settings");
  const integrations = {
    online: razorpayEnabled(), testMode: razorpayTestMode(), webhook: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET),
    dtdc: dtdcEnabled(), tracking: dtdcTrackingEnabled(), staging: process.env.DTDC_ENV === "staging", siteUrl: SITE_URL,
  };
  return <SettingsForm initial={{ settings: await getSettings(), rates: await getRates() }} integrations={integrations} />;
}
