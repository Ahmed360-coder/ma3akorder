import { getDictionary } from "@/lib/i18n/server";
import { getMyBusiness } from "@/lib/business";
import { SettingsForm } from "./settings-form";
import { StoreFields } from "../store-form";

export default async function BusinessSettingsPage() {
  const { t, locale } = await getDictionary();
  const business = await getMyBusiness();
  return (
    <SettingsForm saveLabel={t.common.save} savedLabel={t.common.saved}>
      <StoreFields t={t} business={business} locale={locale} />
    </SettingsForm>
  );
}
