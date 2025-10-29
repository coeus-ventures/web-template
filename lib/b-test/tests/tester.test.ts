import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';
import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from 'playwright';
import { Tester, TesterError } from '../tester';

// Mock only the AI SDK to avoid API calls
vi.mock('ai', () => ({
  generateText: vi.fn(),
}));

vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn(() => 'mocked-model'),
}));

describe('Tester Service', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let tester: Tester;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    context = await browser.newContext();
    page = await context.newPage();
    tester = new Tester(page);

    // Navigate to a test page
    await page.goto(`data:text/html,
      <!DOCTYPE html>
      <html>
        <head><title>Test Page</title></head>
        <body>
          <h1>Test Page</h1>
          <p>Test content</p>
        </body>
      </html>
    `);
  });

  afterEach(async () => {
    await context.close();
  });

  describe('snapshot()', () => {
    it('should capture HTML content of the page', async () => {
      const result = await tester.snapshot();

      expect(result.success).toBe(true);
      expect(result.snapshotId).toMatch(/^snapshot_\d+_\d+$/);

      const snapshot = tester.getSnapshot(result.snapshotId);
      expect(snapshot?.html).toContain('<h1>Test Page</h1>');
    });

    it('should throw error if no page is provided', async () => {
      const testerWithoutPage = new Tester();
      await expect(testerWithoutPage.snapshot()).rejects.toThrow(TesterError);
    });
  });

  describe('assert()', () => {
    beforeEach(async () => {
      // Setup DOM environment for assert testing (since it uses diff)
      const { JSDOM } = require('jsdom');
      const dom = new JSDOM();
      global.DOMParser = dom.window.DOMParser;

      // Mock generateText
      const { generateText } = await import('ai');
      vi.mocked(generateText).mockResolvedValue({
        text: 'true - The condition is met',
        finishReason: 'stop',
        usage: {} as any,
      } as any);
    });

    it('should evaluate condition using diff between snapshot and current state', async () => {
      await tester.snapshot();
      const result = await tester.assert('page has h1 element');

      expect(result).toBe(true);
    });

    it('should throw error if no snapshot exists', async () => {
      await expect(tester.assert('any condition')).rejects.toThrow(TesterError);
    });
  });

  describe('diff()', () => {
    beforeEach(() => {
      // Setup DOM environment for diff testing
      const { JSDOM } = require('jsdom');
      const dom = new JSDOM();
      global.DOMParser = dom.window.DOMParser;
    });

    it('should compare stored snapshot with current page state', async () => {
      await tester.snapshot();

      // Modify the page content
      await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        if (h1) h1.textContent = 'Modified Page';
      });

      const result = await tester.diff();
      expect(result).toBeDefined();
      expect(result.changes).toBeInstanceOf(Array);
    });

    it('should throw error if no snapshot stored', async () => {
      await expect(tester.diff()).rejects.toThrow(TesterError);
    });
  });

  describe('waitFor()', () => {
    it('should poll until condition is met', async () => {
      // Setup DOM environment
      const { JSDOM } = require('jsdom');
      const dom = new JSDOM();
      global.DOMParser = dom.window.DOMParser;

      const { generateText } = await import('ai');
      vi.mocked(generateText)
        .mockResolvedValueOnce({
          text: 'false - not yet',
          finishReason: 'stop',
          usage: {},
        } as any)
        .mockResolvedValueOnce({
          text: 'true - found it',
          finishReason: 'stop',
          usage: {},
        } as any);

      const result = await tester.waitFor('element is visible', 2000);
      expect(result).toBe(true);
    });
  });
});
