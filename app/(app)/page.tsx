import { getTranslations } from "next-intl/server";

export default async function Home() {
  const t = await getTranslations("dashboard");
  return <h1 className="text-2xl font-semibold">{t("title")}</h1>;
}
