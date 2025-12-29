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

    // Use TOKEN (PAT) or GITHUB_TOKEN if available (for CI/CD), otherwise use default git config
    // TOKEN is a Personal Access Token with repo permissions for cross-repo access
    const token = process.env.TOKEN || process.env.GITHUB_TOKEN
    // Deploy to vallista.github.io repository (note: case-sensitive)
    const targetRepo = 'Vallista/vallista.github.io'

    if (!token) {
      console.error(chalk.red('❌ No token found!'))
      console.error(chalk.yellow('Please set TOKEN or GITHUB_TOKEN environment variable.'))
      process.exit(1)
    }

    // In CI/CD environment, use --repo option with token
    // Deploy to vallista.github.io repository
    const repoUrl = `https://x-access-token:${token}@github.com/${targetRepo}.git`
    console.log(chalk.gray(`Deploying to: ${targetRepo} (main branch)`))

    // Quote the URL to handle special characters in token
    // Use --branch main to deploy to main branch instead of gh-pages
    try {
      execSync(`npx gh-pages -d dist --dotfiles --branch main --repo "${repoUrl}"`, { stdio: 'inherit' })
    } catch (error) {
      console.error(chalk.red('Deployment error details:'))
      console.error(error)
      console.error(chalk.yellow('\n💡 Troubleshooting:'))
      console.error(chalk.yellow('1. Check if TOKEN secret is set in GitHub repository settings'))
      console.error(chalk.yellow('2. Verify the token has "repo" scope permissions'))
      console.error(chalk.yellow('3. Ensure the token has access to Vallista/vallista.github.io repository'))
      throw error
    }

    console.log(chalk.green('🎉 Deployment completed!'))
    console.log(chalk.cyan('🌐 Your site should be available at: https://vallista.github.io'))
  } catch (err) {
    console.error(chalk.red('❌ Deployment failed:'), err)
    process.exit(1)
  }
}

deploy()
