import splashMetadata from "./splashMetadata.json";

export interface SplashGraphItem {
  id: string;
  label: string;
  description: string;
  image: string;
}

export const splashGraphItems: SplashGraphItem[] = splashMetadata;
