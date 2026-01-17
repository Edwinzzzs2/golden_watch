import cron from 'node-cron';
import { scrapeAndSave } from '@/lib/scraper';

let task: ReturnType<typeof cron.schedule> | null = null;
let cronExpression: string | null = null;

export function getCronStatus() {
  return {
    enabled: !!task,
    expression: cronExpression,
  };
}

export function stopCron() {
  if (task) {
    task.stop();
    task = null;
  }
  cronExpression = null;
}

export function startCron(expression: string) {
  stopCron();
  const trimmed = expression.trim();
  const validator = (cron as any).validate as ((expr: string) => boolean) | undefined;
  if (validator && !validator(trimmed)) {
    throw new Error('Invalid cron expression');
  }
  cronExpression = trimmed;
  task = cron.schedule(trimmed, async () => {
    try {
      await scrapeAndSave();
    } catch (e) {}
  });
}
