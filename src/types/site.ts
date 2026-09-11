import type { IconName } from '../lib/icons';

export type BrandName =
  'handshake' | 'linkedin' | 'hack-reactor' | 'williams' | 'exeter';
export type ExternalUrl = `https://${string}`;

export interface SocialLink {
  readonly name: string;
  readonly href: ExternalUrl;
  readonly icon: IconName;
}

export interface SiteConfig {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly url: ExternalUrl;
  readonly indexable: boolean;
  readonly social: readonly SocialLink[];
}

export interface GardenPage {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly icon: IconName;
  readonly tone: 'gold' | 'sage' | 'lilac';
}
