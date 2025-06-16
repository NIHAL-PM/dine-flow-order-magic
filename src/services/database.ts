
// Legacy database service - redirects to enhanced database
import { enhancedDB } from './enhancedDatabase';

console.warn('Using legacy database service - consider migrating to enhancedDatabase');

export const db = enhancedDB;
