#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';

/**
 * Generate a new migration file with current timestamp
 * Usage: npm run migrate:create <description>
 * Example: npm run migrate:create add_user_table
 */

// Get the migrations directory path relative to project root
const projectRoot = path.resolve(__dirname, '..');
const migrationsDir = path.join(projectRoot, 'src/infra/database/migrations');

// Get description from command line arguments
const description = process.argv[2];

if (!description) {
  console.error('Error: Migration description is required');
  console.error('Usage: npm run migrate:create <description>');
  console.error('Example: npm run migrate:create add_user_table');
  process.exit(1);
}

// Generate timestamp in format YYYYMMDDHHMMSS
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');
const seconds = String(now.getSeconds()).padStart(2, '0');
const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;

// Create filename
const filename = `${timestamp}_${description}.ts`;
const filepath = path.join(migrationsDir, filename);

// Check if file already exists
if (fs.existsSync(filepath)) {
  console.error(`Error: Migration file ${filename} already exists`);
  process.exit(1);
}

// Migration template
const template = `/**
 * Migration: ${description}
 * Generated: ${now.toISOString()}
 */
export const up = \`
  -- Add your migration SQL here
\`;

export const down = \`
  -- Add your rollback SQL here
\`;
`;

// Write migration file
fs.writeFileSync(filepath, template, 'utf8');

console.log(`✓ Created migration: ${filename}`);
console.log(`  Path: ${filepath}`);