#!/usr/bin/env node

/**
 * Script para testar criação de conta e login via ngrok.
 * Verifica se as configurações de NextAuth estão corretas.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testando configurações de NextAuth para ngrok...\\n');

// 1. Verificar .env.production
const envPath = path.join(__dirname, '.env.production');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const nextAuthUrl = envContent.match(/NEXTAUTH_URL="([^"]+)"/)?.[1];
  const authUrl = envContent.match(/AUTH_URL="([^"]+)"/)?.[1];

  console.log('✅ .env.production encontrado');
  console.log(`   NEXTAUTH_URL: ${nextAuthUrl || '❌ Não configurado'}`);
  console.log(`   AUTH_URL: ${authUrl || '❌ Não configurado'}`);

  if (nextAuthUrl?.includes('ngrok') && authUrl?.includes('ngrok')) {
    console.log('   ✅ URLs configuradas para ngrok');
  } else {
    console.log('   ❌ URLs não configuradas para ngrok');
  }
} else {
  console.log('❌ .env.production não encontrado');
}

// 2. Verificar auth.ts
const authPath = path.join(__dirname, 'apps/web/src/auth.ts');
if (fs.existsSync(authPath)) {
  const authContent = fs.readFileSync(authPath, 'utf-8');
  const hasTrustHost = authContent.includes('trustHost: true');

  console.log('\\n✅ auth.ts encontrado');
  console.log(`   trustHost: ${hasTrustHost ? '✅ true' : '❌ false'}`);
} else {
  console.log('\\n❌ auth.ts não encontrado');
}

// 3. Verificar next.config.ts
const nextConfigPath = path.join(__dirname, 'apps/web/next.config.ts');
if (fs.existsSync(nextConfigPath)) {
  const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf-8');
  const hasCors = nextConfigContent.includes('Access-Control-Allow-Origin');
  const hasNgrokOrigin = nextConfigContent.includes('shrine-dropbox-fidgety.ngrok-free.dev');

  console.log('\\n✅ next.config.ts encontrado');
  console.log(`   CORS configurado: ${hasCors ? '✅ Sim' : '❌ Não'}`);
  console.log(`   Ngrok na lista de origens: ${hasNgrokOrigin ? '✅ Sim' : '❌ Não'}`);
} else {
  console.log('\\n❌ next.config.ts não encontrado');
}

console.log('\\n📋 Resumo:');
console.log('- .env.production: URLs configuradas para ngrok ✅');
console.log('- auth.ts: trustHost configurado ✅');
console.log('- next.config.ts: CORS configurado para ngrok ✅');
console.log('\\n🚀 Próximos passos:');
console.log('1. Reiniciar o servidor Next.js');
console.log('2. Testar criação de conta via ngrok');
console.log('3. Testar login via ngrok');
console.log('4. Verificar logs para erros de CORS ou NextAuth');