/**
 * Route Inventory and Discovery Script
 * Accurately parses route files in server/routes and extracts method, path, middleware, controller
 */
const fs = require('fs');
const path = require('path');

const routesDir = path.resolve(__dirname, '../../server/routes');
const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

const inventory = [];

routeFiles.forEach(file => {
  const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
  
  // Base path mapping based on server/index.js
  let basePath = '/api/v1';
  if (file === 'auth.js') basePath += '/auth';
  else if (file === 'admin.js') basePath += '/admin';
  else if (file === 'examcell.js') basePath += '/examcell';
  else if (file === 'institution.js') basePath += '/institution';
  else if (file === 'timetable.js') basePath += '/timetable';
  else if (file === 'notifications.js') basePath += '/notifications';
  else if (file === 'student.js') basePath += '/student';
  else if (file === 'faculty.js') basePath += '/faculty';
  else if (file === 'hod.js') basePath += '/hod';
  else if (file === 'results.js') basePath += '/results';
  else if (file === 'principal.js') basePath += '/principal';
  else if (file === 'qpSubmission.js') basePath += '/qp-submissions';
  else if (file === 'questionPaperSubmission.js') basePath += '/question-paper-submission';
  else if (file === 'fileProxy.js') basePath += '/file-proxy';
  else basePath += '/' + file.replace('.js', '');

  // Check file-level middleware
  const fileHasGlobalVerify = content.includes('router.use(verifyToken)');
  const fileHasGlobalAuthorize = content.match(/router\.use\(authorize\(([^)]+)\)\)/);
  const globalRoles = fileHasGlobalAuthorize ? fileHasGlobalAuthorize[1].replace(/['"\s]/g, '') : null;

  // Regex to match route definitions
  const routeRegex = /router\.(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]/g;
  let match;

  while ((match = routeRegex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const routePath = match[2];
    const fullPath = (basePath + (routePath === '/' ? '' : routePath)).replace(/\/+/g, '/');
    
    // Find where this route call ends (matching next router. or end of block)
    const startIdx = match.index;
    const nextRouteIdx = content.indexOf('router.', startIdx + 8);
    const chunk = content.substring(startIdx, nextRouteIdx !== -1 ? nextRouteIdx : content.length);

    let hasVerifyToken = fileHasGlobalVerify || chunk.includes('verifyToken');
    if (file === 'fileProxy.js' && routePath === '/') {
      hasVerifyToken = true; // Verified inside handler
    }

    let authorizedRoles = globalRoles;
    const authMatch = chunk.match(/authorize\(([^)]+)\)/);
    if (authMatch) {
      authorizedRoles = authMatch[1].replace(/['"\s]/g, '');
    }

    // Determine security flags
    let authStatus = 'SECURED';
    let flag = '';
    if (!hasVerifyToken) {
      authStatus = 'NO_AUTH';
      flag = '⚠️ PUBLIC / NO AUTH';
    } else if (!authorizedRoles) {
      authStatus = 'AUTHENTICATED_ANY_ROLE';
      flag = 'ℹ️ Any authenticated user';
    }

    inventory.push({
      file,
      method,
      subPath: routePath,
      fullPath,
      hasVerifyToken,
      authorizedRoles: authorizedRoles || (hasVerifyToken ? 'Any logged-in role' : 'None (Public)'),
      authStatus,
      flag
    });
  }
});

// Write /audit/route-inventory.md
let md = `# API Route Inventory - Evalora Backend\n\n`;
md += `Generated: ${new Date().toISOString()}\n`;
md += `Total Routes Discovered: ${inventory.length}\n\n`;

md += `## Summary Statistics\n`;
const publicRoutes = inventory.filter(r => r.authStatus === 'NO_AUTH');
const anyRoleRoutes = inventory.filter(r => r.authStatus === 'AUTHENTICATED_ANY_ROLE');
const roleRestricted = inventory.filter(r => r.authStatus === 'SECURED');

md += `- **Total Routes**: ${inventory.length}\n`;
md += `- **Public Routes (No Authentication)**: ${publicRoutes.length}\n`;
md += `- **Authenticated (Any Valid Token)**: ${anyRoleRoutes.length}\n`;
md += `- **Strict Role Restricted**: ${roleRestricted.length}\n\n`;

md += `## Public Routes (Unauthenticated)\n\n`;
md += `| Method | Path | File | Security Note |\n`;
md += `|--------|------|------|---------------|\n`;
publicRoutes.forEach(r => {
  let note = r.flag;
  if (r.fullPath.includes('/auth/login')) note = 'Authentication endpoint (Intended Public)';
  else if (r.fullPath.includes('/auth/logout')) note = 'Logout endpoint (Client-side token purge)';
  else if (r.fullPath.includes('/institution/')) note = '⚠️ Institution config is publicly accessible without token';
  md += `| \`${r.method}\` | \`${r.fullPath}\` | \`${r.file}\` | ${note} |\n`;
});
md += `\n---\n\n`;

md += `## Complete Route Inventory\n\n`;
md += `| Method | Full Path | Source File | Auth Required | Allowed Roles | Status / Flag |\n`;
md += `|--------|-----------|-------------|---------------|---------------|---------------|\n`;
inventory.forEach(r => {
  md += `| **${r.method}** | \`${r.fullPath}\` | \`${r.file}\` | ${r.hasVerifyToken ? 'Yes' : '**NO**'} | \`${r.authorizedRoles}\` | ${r.flag || '✅ Restricted'} |\n`;
});

const outPath = path.resolve(__dirname, '../route-inventory.md');
fs.writeFileSync(outPath, md, 'utf8');
console.log(`Saved route inventory with ${inventory.length} routes to ${outPath}`);
