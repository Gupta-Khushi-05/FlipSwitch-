import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const ws = await prisma.workspace.upsert({
    where: { name: 'default' },
    update: {},
    create: { name: 'default' }
  });

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      provider: 'github',
      providerId: 'seed-admin',
      name: 'Admin',
      role: 'ADMIN',
      workspaceId: ws.id
    }
  });

  await prisma.user.upsert({
    where: { email: 'reader@example.com' },
    update: {},
    create: {
      email: 'reader@example.com',
      provider: 'github',
      providerId: 'seed-reader',
      name: 'Reader',
      role: 'READONLY',
      workspaceId: ws.id
    }
  });

  await prisma.flag.upsert({
    where: { workspaceId_key: { workspaceId: ws.id, key: 'global.beta-feature' } },
    update: {},
    create: {
      workspaceId: ws.id,
      key: 'global.beta-feature',
      defaultValue: false,
      isEnabled: true,
      rulesJson: JSON.stringify([
        { attribute: 'emailDomain', comparator: 'in', value: 'example.com', rolloutPercentage: 50 },
        { attribute: 'country', comparator: '=', value: 'US' }
      ])
    }
  });

  await prisma.flag.upsert({
    where: { workspaceId_key: { workspaceId: ws.id, key: 'global.always-on' } },
    update: {},
    create: {
      workspaceId: ws.id,
      key: 'global.always-on',
      defaultValue: false,
      isEnabled: true,
      rulesJson: JSON.stringify([
        { attribute: 'role', comparator: 'in', value: 'beta,staff' }
      ])
    }
  });

  await prisma.flag.upsert({
    where: { workspaceId_key: { workspaceId: ws.id, key: 'global.disabled' } },
    update: {},
    create: {
      workspaceId: ws.id,
      key: 'global.disabled',
      defaultValue: false,
      isEnabled: false,
      rulesJson: JSON.stringify([])
    }
  });

  console.log('seed completed');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
