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

    if (token) {
      // In CI/CD environment, update remote URL to include token
      // Get current remote URL
      const currentRemote = execSync('git config --get remote.origin.url', { encoding: 'utf-8' }).trim()

      // Extract repo path from remote URL (handles both https and git@ formats)
      let repoPath = currentRemote
      if (currentRemote.includes('@')) {
        // git@github.com:user/repo.git format
        repoPath = currentRemote.split(':')[1]?.replace('.git', '') || ''
      } else {
        // https://github.com/user/repo.git format
        repoPath = currentRemote.replace('https://github.com/', '').replace('.git', '')
      }

      if (repoPath) {
        // Update remote URL with token
        const repoUrl = `https://${token}@github.com/${repoPath}.git`
        execSync(`git remote set-url origin ${repoUrl}`, { stdio: 'inherit' })
      }

      // Deploy using gh-pages (it will use the updated remote)
      execSync('npx gh-pages -d dist --dotfiles', { stdio: 'inherit' })
    } else {
      // Local deployment
      execSync('npx gh-pages -d dist --dotfiles', { stdio: 'inherit' })
    }

    console.log(chalk.green('🎉 Deployment completed!'))
    console.log(chalk.cyan('🌐 Your site should be available at: https://vallista.github.io/vallista-land'))
  } catch (err) {
    console.error(chalk.red('❌ Deployment failed:'), err)
    process.exit(1)
  }
}

deploy()
