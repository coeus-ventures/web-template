'use client';

import { useEffect } from 'react';

import { resolveHost } from './preview-bridge';

/**
 * Fetches the annotation toolbar from the workspace that is framing this
 * preview.
 *
 * This component is the whole of the toolbar that lives in the template. The
 * toolbar itself is served by Epic and can be replaced by a deploy — which is
 * the only reason it can ever reach a machine built from an old snapshot, since
 * this repository is cloned into a Docker image with no git remote and cannot
 * be updated in place.
 *
 * **The URL is derived, not configured.** The bundle comes from whoever framed
 * this frame — `https://build.epic.new/api/preview-toolbar` in production, the
 * dev workspace's own origin locally. That origin has already been checked
 * against the bridge's allowlist, so there is nothing to configure and nothing
 * to keep in step: the workspace could move to another subdomain tomorrow and
 * this file would not change. A preview framed by a stranger loads nothing.
 *
 * **Inert outside the workspace.** A preview opened directly in a browser tab
 * has no host, so it gets no toolbar: annotation belongs to the workspace, and
 * a person who opened the raw preview asked to see the prototype, not our
 * chrome.
 *
 * Safe to delete if the toolbar is causing trouble — the prototype works
 * without it. Deleting `<PreviewBridge />` is the one that breaks things.
 */

const SOURCE_PATH = '/api/preview-toolbar';
const MARKER = 'data-epic-preview-toolbar-loader';

const SCROLLBARS_MARKER = 'data-epic-preview-scrollbars-early';

/**
 * The app's scrollbars, hidden the moment we know this is a preview.
 *
 * **A copy, on purpose, of what the bundle already does.** `scrollbars.ts` in
 * epic-build carries these same rules and the reasoning behind them — the frame
 * is a picture of a product inside a workspace that has scrollbars of its own,
 * and on Windows and Linux the bar is opaque and 15px wide, so it takes a strip
 * out of the very layout somebody is being asked to judge. Nothing about
 * scrolling changes; `scrollbar-width` and the pseudo-element control the bar,
 * not the overflow.
 *
 * The copy exists because of *when*, not what. The bundle is fetched from the
 * workspace — a redirect, then 96KB, then parse and run — and until it lands the
 * page is on screen with its scrollbars showing. So every reload flashed one in
 * and out. This runs in the same effect that asks for the bundle, which is as
 * early as anything in this document can know it is being framed.
 *
 * Both have to stay. A machine built from an older snapshot has this file's
 * predecessor and only the bundle's copy to save it, and the bundle is the half
 * that a deploy can still reach.
 *
 * If they ever drift, nothing breaks: they are two statements of one intent, not
 * two halves of a protocol.
 */
const SCROLLBAR_RULES = `
  html, body, * {
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }
  ::-webkit-scrollbar,
  ::-webkit-scrollbar-thumb,
  ::-webkit-scrollbar-track {
    width: 0 !important;
    height: 0 !important;
    display: none !important;
  }
`;

export function PreviewToolbarLoader() {
  useEffect(() => {
    if (window.parent === window) return;

    const host = resolveHost();
    if (!host) return;

    /*
      Before the script, because it is the part that cannot wait.

      Same gate as the bundle and deliberately so: `resolveHost()` has just
      answered, which is this document saying it is framed by a workspace. A
      preview opened directly in a tab keeps its scrollbars, exactly as it keeps
      the rest of its own chrome.
    */
    if (!document.querySelector(`style[${SCROLLBARS_MARKER}]`)) {
      const style = document.createElement('style');
      style.setAttribute(SCROLLBARS_MARKER, '');
      style.textContent = SCROLLBAR_RULES;
      document.head.append(style);
    }

    // React can run this effect twice in development, and a reload of the
    // toolbar would leave two of them on the page.
    if (document.querySelector(`script[${MARKER}]`)) return;

    const script = document.createElement('script');
    script.src = `${host}${SOURCE_PATH}`;
    script.async = true;
    script.setAttribute(MARKER, '');
    // A workspace that is down, a bundle that 500s, an offline machine: the
    // prototype is unaffected and says nothing, because the person is here to
    // look at their app.
    script.addEventListener('error', () => script.remove());
    document.head.append(script);

    // No cleanup, deliberately. Removing the tag would not unload the code that
    // already ran, and React mounts effects twice in development — so removing
    // it only let the guard above pass a second time and loaded the bundle
    // twice, which put two toolbars on the page.
  }, []);

  return null;
}
