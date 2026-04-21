#!/usr/bin/env node
// dist/ 를 Vallista/vallista.github.io 레포의 main 브랜치로 push.
// TOKEN 또는 GITHUB_TOKEN 환경변수에 repo scope PAT 이 있어야 한다.

import { execSync } from 'node:child_process'

const TARGET_REPO = 'Vallista/vallista.github.io'

function log(msg) {
  console.log(`[deploy] ${msg}`)
}

function fail(msg) {
  console.error(`[deploy] ${msg}`)
  process.exit(1)
}

try {
  execSync('npx gh-pages --version', { stdio: 'ignore' })
} catch {
  log('installing gh-pages…')
  execSync('npm install -g gh-pages', { stdio: 'inherit' })
}

const token = process.env.TOKEN || process.env.GITHUB_TOKEN
if (!token) {
  fail('TOKEN 또는 GITHUB_TOKEN 이 필요합니다. (PAT, repo scope)')
}

const repoUrl = `https://x-access-token:${token}@github.com/${TARGET_REPO}.git`
log(`deploying dist → ${TARGET_REPO} (main)`)

try {
  execSync(
    `npx gh-pages -d dist --dotfiles --branch main --repo "${repoUrl}" --message "deploy: apps/blog"`,
    { stdio: 'inherit' }
  )
  log('done. site: https://vallista.kr')
} catch (e) {
  console.error(e)
  fail('배포 실패. TOKEN 권한 / repo 접근 권한 확인')
}
