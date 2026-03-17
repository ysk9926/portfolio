import siteData from '../data/site.json';
import { NavItem } from './types';

export const SITE_CONFIG = siteData.config;
export const NAV_ITEMS = siteData.nav as NavItem[];
export const HERO_DATA = siteData.hero;
export const ABOUT_SUMMARY = siteData.aboutSummary;
export const FOOTER_DATA = siteData.footer;
