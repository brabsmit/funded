// Fails when a record still calls something "next" that is more than GRACE_DAYS in the past.
// Run daily by CI (it does not block the deploy): a red run means the Sheet needs an update.
import { readdirSync, readFileSync } from 'node:fs';
import { staleMilestones } from '../src/lib/freshness';
import { today } from '../src/lib/dates';

const GRACE_DAYS = 7;
const dir = 'src/content/schools';
const schools = readdirSync(dir).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')));
const asOf = today();
const stale = staleMilestones(schools, asOf, GRACE_DAYS);
if (stale.length === 0) {
  console.log(`Fresh as of ${asOf}: no "next" milestone is more than ${GRACE_DAYS} days past.`);
} else {
  console.error(`Stale as of ${asOf}. Update these rows in the Milestones tab (mark done, or move the date with a source):`);
  for (const s of stale) console.error(`  ${s.school} / ${s.need} / ${s.milestone}: dated ${s.date}, ${s.daysPast} days ago`);
  process.exitCode = 1;
}
