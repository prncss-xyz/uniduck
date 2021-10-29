import {dirname, join, extname, relative} from 'path';
import fs, {mkdir, writeFile, readFile} from 'fs/promises'
import fetch from 'node-fetch';
import {parse} from 'parse5'
import {fromParse5} from 'hast-util-from-parse5';
import { select, selectAll } from 'hast-util-select';
import {toText} from 'hast-util-to-text';
import {visit} from 'unist-util-visit';
import micromatch from 'micromatch';
import {toHtml} from 'hast-util-to-html'
import {resolve, filePath, relLink, intersects} from './utils.js'

// TODO: scrape links in css
// TODO: simplify indexings (visit nodes with id, no css query)
// TODO: use parse5 directly (remove unist)
// TODO: node events (titles are not pure text nodes)

function checkFileExists(file) {
  return fs.access(file)
  .then(() => true)
  .catch(() => false)
}

function isWanted(fp, fp0) {
  return dirname(fp0).startsWith(dirname(fp)) 
}

let force = true;
async function query(url, fp, isAsset) {
  if (!force) {
    if (await checkFileExists(join(base, fp))) return;
  }
  const response = await fetch(url);
  console.log(`${isAsset ? 'downloading' : 'scraping'} ${url}`);
  await mkdir(join(base, dirname(fp)), {recursive:true})
  if (isAsset) {
    const buffer = await response.buffer();
    await writeFile(join(base, fp), buffer)
  } else {
    const body = await response.text();
    const tree = fromParse5(parse(body));
    visit(tree, function (node, _index, _parent) {
      if (node.tagName === 'script') {
        node = null
        return;
      }
      let href = node.properties?.href;
      if (node.tagName === 'a') {
        if (!href) return;
        if (href.startsWith('#')) return;
        if (['', '.html', '.html'].includes(extname(href))) {
          const url0 = resolve(url, href);
          if (isWanted(fp, filePath(url0))) {
            fetchPage(url0, false);
            node.properties.href = relLink(url, url0);
            return;
          }
          node.properties.href = url0;
          return;
        }
      }
      if (node.tagName === 'link') {
        if (!href) return;
        const rel = node.properties?.rel;
        if (!rel) return;
        if (!intersects(rel, ['stylesheet', 'preload'])) return;
        const url0 = resolve(url, href);
        fetchPage(url0, true);
        node.properties.href = relLink(url, url0);
        return;
      }
      href = node.properties?.src;
      if (href) {
        const url0 = resolve(url, href);
        fetchPage(url0, true);
        node.properties.src = relLink(url, url0);
        return;
      }
      //TODO: srclist
    });
    await writeFile(join(base, fp), toHtml(tree)); 
    const {row, close} = rowGen(fp);
    const analyser = getAnalyser(fp);
    analyser(tree, row);
    await close();
  }
}

const loaded = {}
const queries = [];
function fetchPage(url, isAsset) {
  const fp =  filePath(url)
  if (!loaded[fp]) {
    loaded[fp] = true;
    queries.push(query(url, fp, isAsset));
  }
  return fp;
}

function rowGen(path) {
  let contents = '';
  return {
    row: (name, id) => {
      let href = path;
      if (id) href += '#' + id;
      contents += name+cellSep+href+'\n';
    },
    close: async () => {
      if (contents) {
        console.log('indexing '+path)
        await writeFile(join(base, path + '.csv'), contents);
      }
    },
  }
}

const nodeId = (node) => node.properties?.id;

function getAnalyser(path) {
  if (micromatch.isMatch(path, 'nodejs.org/api/*.html')) {
    return function(tree, row) {
      visit(tree, nodeId, function (node, _index, parent) {
        // TODO: don't need to use parent
        if (!parent.tagName?.match(/^h.$/)) return;
        const textNode = parent.children.find(n => n.type === 'text');
        if (!textNode) return;
        row('node '+textNode.value, node.properties.id);
      })
    }
  }
  return function(tree, row) {
    visit(tree, function (node, _index, _parent) {
      if (node.tagName === 'h1') {
        const textNode = node.children.find(n => n.type === 'text');
        if (!textNode) return;
        row('mdn '+textNode.value);
        // TODO: break
      }
    })
  }
}

const cellSep = '\t';
const base = process.env.WEBDIR;

function init(url) {
  if (!url.includes('://')) {url = 'https://' + url};
  fetchPage(url);
}

async function reIndex(fullPath) {
  const body = await readFile(fullPath, 'utf8'); 
  const tree = fromParse5(parse(body));
  const fp = relative(base, fullPath);
  const {row, close} = rowGen(fp);
  const analyser = getAnalyser(fp);
  analyser(tree, row);
  close();
}

// reIndex('/home/prncss/Media/Web/nodejs.org/api/addons.html')
init('www.nodejs.org/api')
init('developer.mozilla.org/en-US/docs/Web/JavaScript/Reference')
await Promise.all(queries);
