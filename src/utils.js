import {dirname, basename, extname, relative} from 'path';
import md5 from 'blueimp-md5';

// return true if both arrays have at least one common value
export function intersects(as,bs) {
  for (const a of as) {
    for (const b of bs) {
      if (a===b) return true;
    }
  }
  return false;
}

function getHash(url) {
  const ndx = url.indexOf('#')
  let hash = '';
  if (ndx !== -1) {
    hash = url.slice(ndx);
    url = url.slice(0, ndx);
  }
  return hash;
}

export function resolve(url, href) {
  // if (href = '#') {
  //   return url + '#';
  // }
  if (href.includes('://')) {
    return href;
  } 
  const r = new URL(url);
  // absolute
  if (href.startsWith('/')) {
    return 'https://' + r.hostname + href;
  }
  // relative
  let pn = r.pathname;
  if (pn.endsWith('/')) {
    pn = pn.slice(0, pn.length-1)
  }
  let dn;
  if (pn === '') {
    dn = '/';
  } else if (extname(pn)) {
    dn = dirname(pn) + '/'
  } else {
    dn = pn + '/'
  }
  return 'https://' + r.hostname + dn + href;
}

export function filePath(url) {
  const r = new URL(url);
  let pn = r.pathname;
  if (pn.endsWith('/')) {
    pn = pn.slice(0, pn.length-1)
  }
  let fp =  r.host + pn;
  if (pn === '') {
    fp += '/index.html'
  }
  if (fp.startsWith('www.')) {
    fp = fp.slice(4);  
  }
  if (r.search) {
    return fp + '-' + md5(r.search);
  }
  if (extname(fp)) {
    return fp;
  }
  return fp + '/index.html';
}

export function relLink(src, dst) {
  const r = new URL(dst);
  return relative(dirname(filePath(src)), filePath(dst)) + r.hash;
}
