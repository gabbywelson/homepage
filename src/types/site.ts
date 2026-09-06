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

export interface WorkRole {
  readonly title: string;
  readonly period?: string;
  readonly highlights: readonly string[];
}

export interface WorkExperience {
  readonly company: string;
  readonly summary: string;
  readonly period?: string;
  readonly location?: string;
  readonly href?: ExternalUrl;
  readonly brand: BrandName;
  readonly roles: readonly WorkRole[];
}

export interface Education {
  readonly school: string;
  readonly qualification: string;
  readonly period: string;
  readonly location: string;
  readonly href: ExternalUrl;
  readonly brand: BrandName;
}

export interface SkillGroup {
  readonly label: string;
  readonly items: string;
}
