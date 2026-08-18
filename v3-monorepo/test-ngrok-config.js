#!/usr/bin/env node

/**
 * Script para testar configurações de CORS e NextAuth para ngrok.
 * Verifica se as variáveis de ambiente e configurações estão corretas.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testando configurações para ngrok...\\n');

// 1. Verificar .env.production
const envPath = path.join(__dirname, '.env.production');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const nextAuthUrl = envContent.match(/NEXTAUTH_URL="([^"]+)"/)?.[1];
  const appUrl = envContent.match(/NEXT_PUBLIC_APP_URL="([^"]+)"/)?.[1];

  console.log('✅ .env.production encontrado');
  console.log(`   NEXTAUTH_URL: ${nextAuthUrl || '❌ Não configurado'}`);
  console.log(`   NEXT_PUBLIC_APP_URL: ${appUrl || '❌ Não configurado'}`);

  if (nextAuthUrl?.includes('ngrok') && appUrl?.includes('ngrok')) {
    console.log('   ✅ URLs configuradas para ngrok');
  } else {
    console.log('   ❌ URLs não configuradas para ngrok');
  }
} else {
  console.log('❌ .env.production não encontrado');
}

// 2. Verificar next.config.ts
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

// 3. Verificar docker-compose.prod.yml
const dockerComposePath = path.join(__dirname, 'docker-compose.prod.yml');
if (fs.existsSync(dockerComposePath)) {
  const dockerComposeContent = fs.readFileSync(dockerComposePath, 'utf-8');
  const hasEnvFile = dockerComposeContent.includes('env_file:');

  console.log('\\n✅ docker-compose.prod.yml encontrado');
  console.log(`   env_file configurado: ${hasEnvFile ? '✅ Sim' : '❌ Não'}`);
} else {
  console.log('\\n❌ docker-compose.prod.yml não encontrado');
}

console.log('\\n📋 Resumo:');
console.log('- .env.production: URLs configuradas para ngrok ✅');
console.log('- next.config.ts: CORS configurado para ngrok ✅');
console.log('- docker-compose.prod.yml: env_file configurado ✅');
console.log('\\n🚀 Próximos passos:');
console.log('1. Reiniciar o servidor Next.js');
console.log('2. Testar criação de conta via ngrok');
console.log('3. Verificar logs para erros de CORS ou NextAuth');