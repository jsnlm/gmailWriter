import React, { type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import createCache, { type EmotionCache } from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { ThemeProvider } from "@mui/material/styles";
import { gmailTheme } from "../theme";

// Our sidebar's container on the page: a fixed panel on the right edge with a
// shadow root (so Gmail's CSS and ours don't leak into each other), a drag
// handle for resizing, and a React root that renders the sidebar inside it.
// It knows nothing about Gmail; making room on Gmail's page is the caller's job.

const HOST_ID = "gmail-drafter-root";
const MIN_WIDTH = 280;
const MAX_WIDTH = 700;

// Minimal host styles; MUI/emotion handles everything inside the shadow root
const HOST_STYLES = `
  :host {
    all: initial;
    position: fixed;
    top: 0;
    right: 0;
    width: 380px;
    height: 100vh;
    z-index: 2147483647;
    font-family: 'Google Sans', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }
  * { box-sizing: border-box; }
  #resize-handle {
    position: absolute;
    left: 0;
    top: 0;
    width: 6px;
    height: 100%;
    cursor: ew-resize;
    z-index: 1;
    background: transparent;
  }
  #resize-handle:hover {
    background: rgba(26, 115, 232, 0.2);
  }
`;

export interface SidebarHostOptions {
  /** Called continuously while the user drags the resize handle. */
  onResize: (width: number) => void;
  /** Called once when the drag ends, e.g. to save the width. */
  onResizeEnd: (width: number) => void;
}

export class SidebarHost {
  private host: HTMLElement | null = null;
  private root: Root | null = null;
  private emotionCache: EmotionCache | null = null;
  private _width = 0;
  private _isOpen = false;

  constructor(private readonly options: SidebarHostOptions) {}

  get width(): number { return this._width; }
  get isOpen(): boolean { return this._isOpen; }

  /** Renders `content` in the sidebar and shows it at `width` pixels. */
  show(content: ReactNode, width: number): void {
    this.mount();
    this.setWidth(width);
    this.root!.render(
      <CacheProvider value={this.emotionCache!}>
        <ThemeProvider theme={gmailTheme}>{content}</ThemeProvider>
      </CacheProvider>
    );
    this.host!.style.display = "block";
    this._isOpen = true;
  }

  hide(): void {
    if (this.host) this.host.style.display = "none";
    this._isOpen = false;
  }

  private setWidth(width: number): void {
    this._width = width;
    if (this.host) this.host.style.width = `${width}px`;
  }

  /** Creates the panel the first time it's shown. */
  private mount(): void {
    if (this.host) return;

    this.host = document.createElement("div");
    this.host.id = HOST_ID;
    document.body.appendChild(this.host);
    const shadow = this.host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = HOST_STYLES;
    shadow.appendChild(style);

    const resizeHandle = document.createElement("div");
    resizeHandle.id = "resize-handle";
    resizeHandle.addEventListener("mousedown", (e) => this.startResize(e));
    shadow.appendChild(resizeHandle);

    // Emotion injects MUI styles into the shadow root directly
    this.emotionCache = createCache({ key: "gd", container: shadow as unknown as HTMLElement, prepend: true });

    const mountPoint = document.createElement("div");
    mountPoint.style.cssText = "width:100%;height:100%;overflow:hidden;";
    shadow.appendChild(mountPoint);
    this.root = createRoot(mountPoint);
  }

  private startResize(e: MouseEvent): void {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = this._width;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const width = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth - (moveEvent.clientX - startX)));
      this.setWidth(width);
      this.options.onResize(width);
    };
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      this.options.onResizeEnd(this._width);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }
}
