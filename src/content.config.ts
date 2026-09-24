import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { Track, School } from './schema/records';

export const collections = {
  tracks: defineCollection({ loader: glob({ pattern: '*.json', base: './src/content/tracks' }), schema: Track }),
  schools: defineCollection({ loader: glob({ pattern: '*.json', base: './src/content/schools' }), schema: School }),
};
