import * as fs from 'fs';
import * as path from 'path';

describe('docker-compose.yml security validation (P0-008)', () => {
  const composePath = path.resolve(__dirname, '../docker-compose.yml');
  let composeContent: string;

  beforeAll(() => {
    composeContent = fs.readFileSync(composePath, 'utf8');
  });

  it('should not expose postgres port 5432 publicly to host', () => {
    expect(composeContent).not.toMatch(/ports:\s*[\r\n\s]*- "5432:5432"/);
    expect(composeContent).not.toMatch(/ports:\s*[\r\n\s]*- "0\.0\.0\.0:5432:5432"/);
  });

  it('should not expose redis port 6379 publicly to host', () => {
    expect(composeContent).not.toMatch(/ports:\s*[\r\n\s]*- "6379:6379"/);
    expect(composeContent).not.toMatch(/ports:\s*[\r\n\s]*- "0\.0\.0\.0:6379:6379"/);
  });

  it('should retain alumni_network for internal service connection', () => {
    expect(composeContent).toContain('alumni_network');
    expect(composeContent).toContain('expose:');
  });
});
