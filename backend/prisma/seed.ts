import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // ── Admin user ──────────────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@signa-ai.test' },
    update: { role: Role.ADMIN },
    create: {
      email: 'admin@signa-ai.test',
      password: await bcrypt.hash('Admin@1234', 12),
      name: 'Admin',
      role: Role.ADMIN,
    },
  });

  const viewerUser = await prisma.user.upsert({
    where: { email: 'viewer@signa-ai.test' },
    update: { role: Role.VIEWER },
    create: {
      email: 'viewer@signa-ai.test',
      password: await bcrypt.hash('Viewer@1234', 12),
      name: 'Viewer',
      role: Role.VIEWER,
    },
  });

  const editorUser = await prisma.user.upsert({
    where: { email: 'editor@signa-ai.test' },
    update: { role: Role.EDITOR },
    create: {
      email: 'editor@signa-ai.test',
      password: await bcrypt.hash('Editor@1234', 12),
      name: 'Editor',
      role: Role.EDITOR,
    },
  });

  console.log(`✅ User seeded: ${adminUser.email} (id: ${adminUser.id})`); // eslint-disable-line no-console
  console.log(`✅ User seeded: ${viewerUser.email} (id: ${viewerUser.id})`); // eslint-disable-line no-console
  console.log(`✅ User seeded: ${editorUser.email} (id: ${editorUser.id})`); // eslint-disable-line no-console

  // ── Sample Project ──────────────────────────────────────────────────────────
  const sampleProject = await prisma.project.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Demo Project',
      description: 'A sample project for AI-driven end-to-end testing and test generation.',
      createdBy: adminUser.id,
    },
  });

  console.log(`✅ Project seeded: "${sampleProject.name}" (id: ${sampleProject.id})`); // eslint-disable-line no-console

  // ── Sample Environment ──────────────────────────────────────────────────────
  const localEnv = await prisma.environment.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'local',
      baseUrl: 'http://localhost:3000',
      variables: { Authorization: 'Bearer <token>', 'X-App-Version': '1.0.0' },
      projectId: sampleProject.id,
      createdBy: adminUser.id,
    },
  });

  console.log(`✅ Environment seeded: "${localEnv.name}" → ${localEnv.baseUrl}`); // eslint-disable-line no-console

  // ── Sample Requirement ──────────────────────────────────────────────────
  const sampleReq = await prisma.requirement.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      title: 'User Authentication & Session Management',
      description: 'Users must be able to securely sign in using valid email credentials, receive a JWT token, and view protected dashboard resources.',
      projectId: sampleProject.id,
      createdBy: adminUser.id,
    },
  });

  console.log(`✅ Requirement seeded: "${sampleReq.title}"`); // eslint-disable-line no-console

  // ── Sample Test Case ────────────────────────────────────────────────────
  const sampleTestCase = await prisma.testCase.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      title: 'Verify Successful User Login with Valid Credentials',
      type: 'UI',
      preconditions: 'User is registered and navigates to the login screen',
      expectedResult: 'User is authenticated and redirected to the project dashboard',
      steps: [
        { order: 1, action: 'Navigate to /login', expected: 'Login form is displayed' },
        { order: 2, action: 'Enter admin email and password', expected: 'Fields are populated' },
        { order: 3, action: 'Click "Sign in" button', expected: 'User is redirected to projects list' },
      ],
      scriptFormat: 'python-playwright',
      scriptContent: `# Auto-generated Playwright Test Script
from playwright.sync_api import sync_playwright

def test_login():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:5173/login")
        page.fill('input[type="email"]', "admin@signa-ai.test")
        page.fill('input[type="password"]', "Admin@1234")
        page.click('button[type="submit"]')
        page.wait_for_url("http://localhost:5173/")
        assert "Signa AI" in page.title() or page.is_visible("text=Projects")
        browser.close()
`,
      projectId: sampleProject.id,
      requirementId: sampleReq.id,
      createdBy: adminUser.id,
    },
  });

  console.log(`✅ TestCase seeded: "${sampleTestCase.title}"`); // eslint-disable-line no-console
}



main()
  .catch((err: unknown) => {
    console.error('❌ Seed failed:', err); // eslint-disable-line no-console
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
