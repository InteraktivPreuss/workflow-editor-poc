// Minimal, zero-dependency workflow store that speaks Nick's `workflows.json`
// format (https://nick.docs.plone.org/developer-guide/workflows).
//
// Nick itself has no runtime API to edit workflow *definitions* (they are seeded
// from src/profiles/default/workflows.json on disk). This service persists that
// exact file and exposes a small REST API so the editor can list / open / save /
// create workflows. Point WORKFLOWS_FILE at a real Nick profile's workflows.json
// (e.g. a mounted volume) and re-run `pnpm seed` in Nick to apply changes.
//
// Run: node server.mjs   (PORT, WORKFLOWS_FILE env vars)

import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';

const PORT = Number(process.env.PORT ?? 8090);
const FILE = process.env.WORKFLOWS_FILE ?? new URL('./data/workflows.json', import.meta.url).pathname;

const DEFAULT_DATA = {
  purge: false,
  workflows: [
    {
      id: 'example_workflow',
      'title:i18n': 'Example Publication Workflow',
      'description:i18n': 'A simple private → pending → published flow.',
      json: {
        initial_state: 'private',
        states: {
          private: {
            'title:i18n': 'Private',
            'description:i18n': 'Visible only to the owner and reviewers.',
            transitions: ['submit'],
            permissions: {
              Owner: ['View', 'Modify portal content', 'Request review'],
              Manager: ['View', 'Modify portal content', 'Review portal content', 'Request review'],
              Reviewer: ['View'],
            },
          },
          pending: {
            'title:i18n': 'Pending review',
            'description:i18n': 'Submitted and awaiting review.',
            transitions: ['publish', 'reject'],
            permissions: {
              Owner: ['View'],
              Reviewer: ['View', 'Review portal content'],
              Manager: ['View', 'Modify portal content', 'Review portal content'],
            },
          },
          published: {
            'title:i18n': 'Published',
            'description:i18n': 'Visible to everyone.',
            transitions: ['retract'],
            permissions: {
              Anonymous: ['View'],
              Owner: ['View'],
              Manager: ['View', 'Modify portal content'],
            },
          },
        },
        transitions: {
          submit: { 'title:i18n': 'submit', new_state: 'pending', permission: 'Request review' },
          publish: { 'title:i18n': 'publish', new_state: 'published', permission: 'Review portal content' },
          reject: { 'title:i18n': 'reject', new_state: 'private', permission: 'Review portal content' },
          retract: { 'title:i18n': 'retract', new_state: 'private', permission: 'Review portal content' },
        },
      },
    },
  ],
};

async function load() {
  if (!existsSync(FILE)) {
    await mkdir(dirname(FILE), { recursive: true });
    await writeFile(FILE, JSON.stringify(DEFAULT_DATA, null, 2));
    return structuredClone(DEFAULT_DATA);
  }
  return JSON.parse(await readFile(FILE, 'utf8'));
}

async function save(data) {
  await mkdir(dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(data, null, 2));
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...CORS });
  res.end(body === undefined ? '' : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') return send(res, 204);

    const url = new URL(req.url, `http://localhost:${PORT}`);
    const parts = url.pathname.split('/').filter(Boolean); // e.g. ['workflows','id']

    if (parts[0] === 'health' || parts.length === 0) return send(res, 200, { ok: true });

    if (parts[0] !== 'workflows') return send(res, 404, { error: 'not found' });

    const data = await load();
    const id = parts[1] ? decodeURIComponent(parts[1]) : null;

    // GET /workflows -> [{ id, title }]
    if (!id && req.method === 'GET') {
      return send(
        res,
        200,
        data.workflows.map((w) => ({ id: w.id, title: w['title:i18n'] ?? w.id })),
      );
    }

    // POST /workflows -> create from { workflows: [wf] } or a bare wf
    if (!id && req.method === 'POST') {
      const body = await readBody(req);
      const wf = body.workflows?.[0] ?? body;
      if (!wf?.id || !wf?.json) return send(res, 400, { error: 'expected a workflow with id and json' });
      if (data.workflows.some((w) => w.id === wf.id)) return send(res, 409, { error: `workflow "${wf.id}" exists` });
      data.workflows.push(wf);
      await save(data);
      return send(res, 201, { id: wf.id });
    }

    // GET /workflows/:id -> { purge:false, workflows:[wf] }
    if (id && req.method === 'GET') {
      const wf = data.workflows.find((w) => w.id === id);
      if (!wf) return send(res, 404, { error: `workflow "${id}" not found` });
      return send(res, 200, { purge: false, workflows: [wf] });
    }

    // PUT /workflows/:id -> upsert
    if (id && req.method === 'PUT') {
      const body = await readBody(req);
      const wf = body.workflows?.[0] ?? body;
      if (!wf?.json) return send(res, 400, { error: 'expected a workflow with json' });
      wf.id = wf.id || id;
      const i = data.workflows.findIndex((w) => w.id === id);
      if (i >= 0) data.workflows[i] = wf;
      else data.workflows.push(wf);
      await save(data);
      return send(res, 200, { id: wf.id });
    }

    // DELETE /workflows/:id
    if (id && req.method === 'DELETE') {
      const before = data.workflows.length;
      data.workflows = data.workflows.filter((w) => w.id !== id);
      if (data.workflows.length === before) return send(res, 404, { error: `workflow "${id}" not found` });
      await save(data);
      return send(res, 200, { ok: true });
    }

    return send(res, 405, { error: 'method not allowed' });
  } catch (e) {
    return send(res, 500, { error: String(e?.message ?? e) });
  }
});

server.listen(PORT, () => {
  console.log(`workflow store listening on http://localhost:${PORT}  (file: ${FILE})`);
});
