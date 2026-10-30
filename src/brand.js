export const brand = Object.freeze({
  company: Object.freeze({
    name: "HEPHZIBAH BEHULAH",
    logo: Object.freeze({ light:"assets/brand/company-official.jpg", dark:"assets/brand/company-official.jpg" }),
    links: Object.freeze([
      Object.freeze({ key:"website", labelKey:"companyWebsite", url:"https://hephzibahbehulah.com/" }),
      Object.freeze({ key:"facebook", labelKey:"facebook", url:"https://www.facebook.com/Hephzibahbehulah/" }),
      Object.freeze({ key:"x", labelKey:"xSocial", url:"https://x.com/HephzibaBehulah" }),
      Object.freeze({ key:"instagram", labelKey:"instagram", url:"https://www.instagram.com/hephzibahbehulah/" }),
      Object.freeze({ key:"tiktok", labelKey:"tiktok", url:"https://www.tiktok.com/@hephzibahbhehulah" }),
      Object.freeze({ key:"linkedin", labelKey:"linkedinPersonal", url:"https://www.linkedin.com/in/isaacoluwoleadigun/" }),
    ]),
  }),
  division: Object.freeze({ name:"HB Elektroniker", accent:"#22D3EE", prefix:Object.freeze({ en:"BY", de:"VON", yo:"LÁTI", pcm:"FROM" }) }),
  products: Object.freeze({
    adigunsps: Object.freeze({
      name: "AdigunSPs",
      logo: Object.freeze({ light:"assets/brand/adigunsps-logo-light.svg", dark:"assets/brand/adigunsps-logo-dark.svg" }),
      icons: Object.freeze({ light192:"assets/brand/adigunsps-icon-light-192.svg", dark192:"assets/brand/adigunsps-icon-dark-192.svg", light512:"assets/brand/adigunsps-icon-light-512.svg", dark512:"assets/brand/adigunsps-icon-dark-512.svg" }),
      splash: Object.freeze({ light:"assets/brand/splash-light.svg", dark:"assets/brand/splash-dark.svg" }),
    }),
  }),
  activeProductId: "adigunsps",
  attribution: Object.freeze({
    en: "AdigunSPs — HB Elektroniker, a product of HEPHZIBAH BEHULAH",
    de: "AdigunSPs — HB Elektroniker, ein Produkt von HEPHZIBAH BEHULAH",
    yo: "AdigunSPs — HB Elektroniker, ọjà ilé-iṣẹ́ HEPHZIBAH BEHULAH",
    pcm: "AdigunSPs — HB Elektroniker, product from HEPHZIBAH BEHULAH",
  }),
  description: Object.freeze({
    en: "AdigunSPs — HB Elektroniker, a product of HEPHZIBAH BEHULAH. Offline-first PLC learning and simulation.",
    de: "AdigunSPs — HB Elektroniker, ein Produkt von HEPHZIBAH BEHULAH. Offline SPS lernen und simulieren.",
    yo: "AdigunSPs — HB Elektroniker, ọjà ilé-iṣẹ́ HEPHZIBAH BEHULAH. Ẹ̀kọ́ PLC àti ìṣàfarawé láìsí ayélujára.",
    pcm: "AdigunSPs — HB Elektroniker, product from HEPHZIBAH BEHULAH. Learn PLC and run simulation offline.",
  }),
  manifest: Object.freeze({ en:"manifest.webmanifest", de:"manifest.de.webmanifest", yo:"manifest.yo.webmanifest", pcm:"manifest.pcm.webmanifest" }),
  manifestName: Object.freeze({
    en:"AdigunSPs — a product of HEPHZIBAH BEHULAH | HB Elektroniker",
    de:"AdigunSPs — ein Produkt von HEPHZIBAH BEHULAH | HB Elektroniker",
    yo:"AdigunSPs — ọjà HEPHZIBAH BEHULAH | HB Elektroniker",
    pcm:"AdigunSPs — product from HEPHZIBAH BEHULAH | HB Elektroniker",
  }),
  tagline: null,
  contact: null,
  colors: Object.freeze({ navy:"#0B1220", gold:"#D4AF37", royalBlue:"#2563EB", ivory:"#F8FAFC", elektroniker:"#22D3EE" }),
});

export function brandPresentation(language = "en", theme = "dark", productId = brand.activeProductId) {
  const product = brand.products[productId];
  if (!product) throw new Error(`Unknown product brand: ${productId}`);
  return {
    companyName: brand.company.name,
    companyLogo: brand.company.logo[theme === "light" ? "light" : "dark"],
    productName: product.name,
    productIcon: product.icons[theme === "light" ? "light512" : "dark512"],
    divisionName: brand.division.name,
    divisionLabel: `${brand.division.prefix[language] || brand.division.prefix.en} ${brand.division.name.toUpperCase()}`,
    splash: product.splash[theme === "light" ? "light" : "dark"],
    attribution: brand.attribution[language] || brand.attribution.en,
    description: brand.description[language] || brand.description.en,
    manifest: brand.manifest[language] || brand.manifest.en,
    manifestName: brand.manifestName[language] || brand.manifestName.en,
  };
}
