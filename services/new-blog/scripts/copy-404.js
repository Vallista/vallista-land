#!/usr/bin/env node
/* eslint-env node */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import chalk from 'chalk'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DIST_DIR = path.join(__dirname, '../dist')
const INDEX_HTML = path.join(DIST_DIR, 'index.html')
const NOT_FOUND_HTML = path.join(DIST_DIR, '404.html')

async function copy404() {
  try {
    console.log(chalk.blue('📋 Copying index.html to 404.html for SPA routing...'))
    
    // Check if index.html exists
    try {
      await fs.access(INDEX_HTML)
    } catch {
      console.error(chalk.red('❌ index.html not found in dist directory'))
      console.error(chalk.yellow('Please run build first'))
      process.exit(1)
    }

    // Copy index.html to 404.html
    await fs.copyFile(INDEX_HTML, NOT_FOUND_HTML)
    console.log(chalk.green('✅ 404.html created successfully'))
  } catch (err) {
    console.error(chalk.red('❌ Failed to copy 404.html:'), err)
    process.exit(1)
  }
}

copy404()

