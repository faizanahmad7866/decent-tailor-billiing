import ts from 'typescript';
import { COLORS, applyLook } from '../constants/theme';
import { HINDI } from './hindi';
import { hindiOf, setLanguage, t } from './t';

// The Hindi and dark mode only hold if every screen plays along, and a missed word
// or a colour kept in a constant still compiles. So the source itself is read here.

// Node's own, typed here only as far as used: the app itself has no Node types.
declare const __dirname: string;
const fs: {
  readdirSync(
    dir: string,
    options: { withFileTypes: true }
  ): { name: string; isDirectory(): boolean }[];
  readFileSync(file: string, encoding: 'utf8'): string;
} = require('fs');
const path: {
  join(...parts: string[]): string;
  relative(from: string, to: string): string;
} = require('path');

const ROOT = path.join(__dirname, '..', '..');

const sourceFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(entry.name) && !/\.test\./.test(entry.name)
      ? [full]
      : [];
  });

const FILES = [
  ...sourceFiles(path.join(ROOT, 'src')),
  path.join(ROOT, 'App.tsx'),
];

const parse = (file: string): ts.SourceFile =>
  ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

const where = (node: ts.Node): string => {
  const source = node.getSourceFile();
  const { line } = source.getLineAndCharacterOfPosition(node.getStart());
  return `${path.relative(ROOT, source.fileName)}:${line + 1}`;
};

const walk = (node: ts.Node, visit: (node: ts.Node) => void): void => {
  visit(node);
  ts.forEachChild(node, (child) => walk(child, visit));
};

const insideFunction = (node: ts.Node): boolean => {
  for (let up = node.parent; up; up = up.parent) {
    if (ts.isFunctionLike(up)) return true;
  }
  return false;
};

const isLiteral = (node: ts.Node): node is ts.StringLiteralLike =>
  ts.isStringLiteralLike(node);

const callName = (node: ts.CallExpression): string => node.expression.getText();

/** Every word put through t() or later(), and where. */
const usedKeys = (): Map<string, string> => {
  const keys = new Map<string, string>();
  FILES.forEach((file) =>
    walk(parse(file), (node) => {
      if (!ts.isCallExpression(node)) return;
      if (!['t', 'later'].includes(callName(node))) return;
      const [first] = node.arguments;
      if (first && isLiteral(first)) keys.set(first.text, where(node));
    })
  );
  return keys;
};

describe('every word on a screen has its Hindi', () => {
  afterEach(() => setLanguage('en'));

  it('finds Hindi for every word put through t()', () => {
    const missing = [...usedKeys()].filter(([key]) => hindiOf(key) === null);
    expect(missing).toEqual([]);
  });

  it('finds Hindi for every label on a bill', () => {
    const { LABEL } = require('../constants/labels');
    const missing = Object.values<string>(LABEL).filter(
      (label) => hindiOf(label) === null
    );
    expect(missing).toEqual([]);
  });

  it('keeps every {0} of the English in the Hindi', () => {
    const slots = (text: string): string[] =>
      (text.match(/\{\d+\}/g) ?? []).sort();
    const broken = Object.entries(HINDI).filter(
      ([english, hindi]) => slots(english).join() !== slots(hindi).join()
    );
    expect(broken).toEqual([]);
  });

  it('really is in Hindi, the names of things aside', () => {
    const NAMES = ['DT Billing', 'Decent Tailor', 'QR · {0}'];
    const english = Object.entries(HINDI).filter(
      ([key, hindi]) =>
        !NAMES.includes(key) &&
        !/[ऀ-ॿ]/.test(hindi) &&
        /[A-Za-z]/.test(key.replace(/\{\d+\}/g, ''))
    );
    expect(english).toEqual([]);
  });

  it('leaves no word in the dictionary that no screen asks for', () => {
    const used = usedKeys();
    // Put together from a variable: tabs, and the counts in utils/dataSummary.
    const BUILT = new Set([
      'bill',
      'bills',
      'cloth',
      'cloths',
      'design',
      'designs',
      'photo',
      'photos',
      'video',
      'videos',
      'Bills',
      'Cloths',
      'Patterns',
      'Settings',
    ]);
    const unused = Object.keys(HINDI).filter(
      (key) => !used.has(key) && !BUILT.has(key)
    );
    expect(unused).toEqual([]);
  });

  it('leaves no words written straight into a screen', () => {
    const SCREENS = /src\/(screens|components|navigation)\//;
    const left: string[] = [];
    FILES.filter((file) => SCREENS.test(file)).forEach((file) =>
      walk(parse(file), (node) => {
        if (ts.isJsxText(node) && /[A-Za-z]{2}/.test(node.text)) {
          left.push(`${where(node)} ${node.text.trim()}`);
        }
        if (
          ts.isJsxAttribute(node) &&
          [
            'label',
            'title',
            'subtitle',
            'placeholder',
            'hint',
            'message',
          ].includes(node.name.getText()) &&
          node.initializer &&
          isLiteral(node.initializer) &&
          /[A-Za-z]{2}/.test(node.initializer.text)
        ) {
          left.push(`${where(node)} ${node.getText()}`);
        }
      })
    );
    expect(left).toEqual([]);
  });

  it('passes no untranslated word into a sentence', () => {
    const inside: string[] = [];
    // Down through a value, stopping at a t() of its own: that word is in Hindi.
    const check = (node: ts.Node): void => {
      if (ts.isCallExpression(node) && callName(node) === 't') return;
      if (isLiteral(node) && /[A-Za-z]{2}/.test(node.text)) {
        inside.push(`${where(node)} ${node.text}`);
      }
      ts.forEachChild(node, check);
    };
    FILES.forEach((file) =>
      walk(parse(file), (node) => {
        if (ts.isCallExpression(node) && callName(node) === 't') {
          node.arguments.slice(1).forEach(check);
        }
      })
    );
    expect(inside).toEqual([]);
  });

  it('never looks a word up before a screen draws', () => {
    const early: string[] = [];
    FILES.forEach((file) =>
      walk(parse(file), (node) => {
        if (
          ts.isCallExpression(node) &&
          callName(node) === 't' &&
          !insideFunction(node)
        ) {
          early.push(`${where(node)} ${node.getText()}`);
        }
      })
    );
    expect(early).toEqual([]);
  });

  it('does not touch what is printed or sent to a customer', () => {
    const DOCUMENTS = [
      'billHtml',
      'billMessage',
      'billText',
      'clothLabel',
      'designCatalogHtml',
      'designShareText',
      'paymentReminder',
      'receiptText',
      'shareDesign',
      'printBill',
    ];
    const translated = DOCUMENTS.filter((name) =>
      /from '\.\.\/i18n\//.test(
        fs.readFileSync(path.join(ROOT, 'src/print', `${name}.ts`), 'utf8')
      )
    );
    expect(translated).toEqual([]);
  });

  it('swaps the language, and puts values where the Hindi wants them', () => {
    expect(t('{0} of {1} designs', 2, 9)).toBe('2 of 9 designs');
    setLanguage('hi');
    expect(t('{0} of {1} designs', 2, 9)).toBe('9 में से 2 डिज़ाइन');
    expect(t('Cloth · कपड़ा')).toBe('कपड़ा');
    expect(t('Cloth needed · कपड़ा (optional)')).toBe('कपड़ा (वैकल्पिक)');
    // A name the tailor typed is not a word to look up.
    expect(t('Raymond')).toBe('Raymond');
  });
});

describe('dark mode reaches every screen', () => {
  afterEach(() => applyLook(false, false));

  it('never keeps a colour in a constant, where a change would miss it', () => {
    const ALLOWED = /src\/constants\/theme\.ts$/;
    const kept: string[] = [];
    FILES.filter((file) => !ALLOWED.test(file)).forEach((file) =>
      walk(parse(file), (node) => {
        if (
          ts.isPropertyAccessExpression(node) &&
          ['COLORS', 'CARD', 'INITIAL_TILE'].includes(
            node.expression.getText()
          ) &&
          !insideFunction(node)
        ) {
          kept.push(where(node));
        }
      })
    );
    expect(kept).toEqual([]);
  });

  it('builds every style sheet through themedStyles', () => {
    const plain = FILES.filter(
      (file) =>
        !file.endsWith('themedStyles.ts') &&
        fs.readFileSync(file, 'utf8').includes('StyleSheet.create')
    );
    expect(plain).toEqual([]);
  });

  const luminance = (hex: string): number => {
    const channel = (at: number): number => {
      const value = parseInt(hex.slice(at, at + 2), 16) / 255;
      return value <= 0.03928
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  };
  const contrast = (a: string, b: string): number => {
    const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (high + 0.05) / (low + 0.05);
  };

  it.each([
    ['light', false],
    ['dark', true],
  ])('keeps text readable in %s', (_name, dark) => {
    applyLook(dark, false);
    const { background, surface } = COLORS;
    [background, surface].forEach((ground) => {
      expect(contrast(COLORS.textPrimary, ground)).toBeGreaterThan(7);
      expect(contrast(COLORS.textSecondary, ground)).toBeGreaterThan(4.4);
      expect(contrast(COLORS.success, ground)).toBeGreaterThan(3);
      expect(contrast(COLORS.warning, ground)).toBeGreaterThan(3);
      expect(contrast(COLORS.danger, ground)).toBeGreaterThan(3);
    });
    expect(contrast(COLORS.onPrimary, COLORS.primary)).toBeGreaterThan(4.5);
  });

  it('keeps a QR black on white, whatever the mode', () => {
    applyLook(true, false);
    expect(COLORS.qrDark).toBe('#000000');
    expect(COLORS.qrLight).toBe('#FFFFFF');
  });

  it('sets no letter-spacing on Hindi, which breaks its letters apart', () => {
    const { TYPE } = require('../constants/theme');
    applyLook(false, true);
    expect(TYPE.overline.letterSpacing).toBe(0);
    applyLook(false, false);
    expect(TYPE.overline.letterSpacing).toBe(0.5);
  });
});
