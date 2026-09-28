import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { District, Track, School } from './schema/records';

export const collections = {
  districts: defineCollection({ loader: glob({ pattern: '*.json', base: './src/content/districts' }), schema: District }),
  tracks: defineCollection({ loader: glob({ pattern: '*.json', base: './src/content/tracks' }), schema: Track }),
  schools: defineCollection({ loader: glob({ pattern: '*.json', base: './src/content/schools' }), schema: School }),
};
