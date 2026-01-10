/**
 * Pipeline UI 交互测试套件索引
 */

export { NavigationTests } from './01-navigation.spec';
export { TaskPageTests } from './02-task-page.spec';
export { RunsPageTests } from './03-runs-page.spec';
export { QueuePageTests } from './04-queue-page.spec';
export { ReviewPageTests } from './05-review-page.spec';

export const AllTestSuites = [
  'NavigationTests',
  'TaskPageTests', 
  'RunsPageTests',
  'QueuePageTests',
  'ReviewPageTests',
];
