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

    // Use GITHUB_TOKEN if available (for CI/CD), otherwise use default git config
    const token = process.env.GITHUB_TOKEN
    // Deploy to vallista.github.io repository
    const targetRepo = 'vallista/vallista.github.io'

    if (token) {
      // In CI/CD environment, use --repo option with token
      // Deploy to vallista.github.io repository
      const repoUrl = `https://x-access-token:${token}@github.com/${targetRepo}.git`
      // Quote the URL to handle special characters in token
      execSync(`npx gh-pages -d dist --dotfiles --repo "${repoUrl}"`, { stdio: 'inherit' })
    } else {
      // Local deployment - also deploy to vallista.github.io
      const repoUrl = `https://github.com/${targetRepo}.git`
      execSync(`npx gh-pages -d dist --dotfiles --repo "${repoUrl}"`, { stdio: 'inherit' })
    }

    console.log(chalk.green('🎉 Deployment completed!'))
    console.log(chalk.cyan('🌐 Your site should be available at: https://vallista.github.io'))
  } catch (err) {
    console.error(chalk.red('❌ Deployment failed:'), err)
    process.exit(1)
  }
}

deploy()
