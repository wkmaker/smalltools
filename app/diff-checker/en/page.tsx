import type { Metadata } from 'next';
import DiffCheckerClient from '../DiffCheckerClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'Document Diff Checker - Free Online Code & Text Comparison Tool',
  description:
    'Free online Document Diff Checker tool! Supports side-by-side split view, unified line-by-line comparison, Myers algorithm diff parsing, and local privacy security.',
  keywords:
    'document diff, text comparison, diff checker, code comparison, text diff, diff analysis, online diff tool',
  alternates: {
    canonical: 'https://tools.cjkuo.net/diff-checker/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/diff-checker/',
      en: 'https://tools.cjkuo.net/diff-checker/en/',
      'x-default': 'https://tools.cjkuo.net/diff-checker/en/',
    },
  },
  openGraph: {
    title: 'Document Diff Checker - Free Online Code & Text Comparison Tool',
    description: '100% private and secure text diff tool supporting Split and Unified view modes.',
    url: 'https://tools.cjkuo.net/diff-checker/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Document Diff Checker - Free Online Code & Text Comparison Tool',
    description: '100% private and secure text diff tool supporting Split and Unified view modes.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Document Diff Checker',
  url: 'https://tools.cjkuo.net/diff-checker/en/',
  description: 'Free online document diff checker supporting side-by-side split view and interactive unified merge.',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: 'What is a Text Diff Checker and how does the underlying comparison algorithm work?',
    a: 'A Diff Checker identifies structural and line-level changes between two text or code files:\n\n① Classic Myers Diff Algorithm:\nPowered by the Myers Difference Algorithm (the same engine underpinning Git and standard version control systems), it calculates the Shortest Edit Script (SES) to find minimal edit sets.\n\n② Visual Line & Character Highlights:\nClearly flags inserted, deleted, and unmodified lines with colored indicators, speeding up code reviews, legal contract auditing, and copywriting revisions.',
  },
  {
    q: 'What is the difference between Split Mode (Side-by-Side) and Unified Mode?',
    a: 'Each view mode serves distinct review preferences:\n\n① Side-by-Side Split View:\nDisplays the original and modified documents side-by-side with synchronized dual-pane scroll locking, perfect for examining structural layout shifts.\n\n② Single-Pane Unified View:\nMerges all revisions into a continuous single stream with red/green diff badges (similar to GitHub PRs and Git patch files), ideal for line-by-line inspection.',
  },
  {
    q: 'Is it secure to paste proprietary code, legal contracts, or sensitive text into this online tool?',
    a: '100% Secure! The tool operates strictly as a client-side web application in your browser:\n\n① Zero Backend Transmission:\nAll diff calculations and syntax rendering occur purely within your computer memory.\n\n② Zero Cloud Logging:\nNo text, files, or metadata are ever uploaded to remote servers. The tool functions completely offline.',
  },
  {
    q: 'What does the "Ignore Case" option do, and when should it be toggled on?',
    a: 'Toggling case-insensitivity alters match semantics:\n\n① Disregarding Capitalization:\nTreats `Apple` and `apple` as identical tokens without flagging them as differences.\n\n② Best Use Cases:\nIdeal for SQL queries, HTML markup, configuration files, or general copy editing where letter case does not affect technical semantics.',
  },
  {
    q: 'What file types are supported for drag-and-drop file imports? Are there file size limits?',
    a: 'Our tool accepts a wide range of plain text and developer source files:\n\n① Supported Formats:\nText documents (`.txt`, `.md`, `.json`, `.csv`, `.xml`, `.yaml`) and programming source files (`.js`, `.ts`, `.py`, `.java`, `.go`, `.cpp`, `.css`, `.html`, etc.).\n\n② Performance Guideline:\nWe recommend files under 10MB (several hundred thousand lines) to preserve 60fps browser rendering responsiveness.',
  },
  {
    q: 'How does the interactive "Merge Diff" workflow operate in Unified Mode?',
    a: 'A built-in interactive reconciliation engine:\n\n① Custom Line Selection:\nIn Unified mode, click any modified line to toggle between "Active (Kept)" and "Skipped" states to curate your final revision.\n\n② One-Click Merged Export:\nClick "Copy Merged Result" or "Export Merged File" to instantly generate a unified resolved document.',
  },
  {
    q: 'How can I quickly swap comparison directions or reset the workspace?',
    a: 'Productivity toolbar shortcuts:\n\n① Swap Button:\nInstantly swap the Original and Modified buffers without manual cut-and-paste.\n\n② Focus Mode & Clear:\nToggle "Show Diff Only" to maximize the comparison pane or use "Clear" to wipe both editors.',
  },
]);

export default function DiffCheckerEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <DiffCheckerClient lang="en" />
    </>
  );
}
