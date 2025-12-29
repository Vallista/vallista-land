#!/usr/bin/env node
/* eslint-env node */

import { execSync } from 'child_process'
import chalk from 'chalk'

async function deploy() {
  try {
    console.log(chalk.cyan('🚀 Starting deployment...'))

    // Check if gh-pages is installed
    try {
      execSync('npx gh-pages --version', { stdio: 'ignore' })
    } catch {
      console.log(chalk.yellow('📦 Installing gh-pages...'))
      execSync('npm install -g gh-pages', { stdio: 'inherit' })
    }

    // Deploy to GitHub Pages
    console.log(chalk.blue('📤 Deploying to GitHub Pages...'))
    execSync('npx gh-pages -d dist --dotfiles', { stdio: 'inherit' })

    console.log(chalk.green('🎉 Deployment completed!'))
    console.log(chalk.cyan('🌐 Your site should be available at: https://vallista.github.io/vallista-land'))
  } catch (err) {
    console.error(chalk.red('❌ Deployment failed:'), err)
    process.exit(1)
  }
}

deploy()
