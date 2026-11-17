# Gmail AI Drafter

A Chrome (Manifest V3) extension that drafts Gmail replies and new emails with an LLM, in a sidebar on the Gmail page.

## Specs and roadmap live in Notion

The product specs, the Pre-Launch checklist and the Fast Follow list are kept in Notion, not in this repo:

- **Gmail Chrome Extension** (under Coding Projects): https://app.notion.com/p/415264b1d4a281b8bd71fce700b9ed96
- **Research: Handling Gmail page changes** (a subpage): https://app.notion.com/p/419264b1d4a2815c93b1edd20ec1c38e

At the start of a session, and before planning any feature work, fetch the main page with the Notion tools to see what's done and what's next. When a roadmap item ships, strike it through on that page; add new to-dos and research there, not in repo files. If the Notion tools aren't connected, say so rather than guessing at the roadmap.

`instructions.md` is the original product brief: the reply flow, plus settings for sample emails, personal details and the LLM provider.

## How it's built

- Vite + `@crxjs/vite-plugin`. `npm run dev` hot-reloads the extension; `npm run build` builds to `dist/`.
- **`src/content/`**: the content script on Gmail.
  - All reading and writing of Gmail's DOM goes through the `gmailPage` front door (`src/content/gmailPage/gmailPage.ts`).
  - Every selector lives in `selectors.ts`.
  - Threads are read from Gmail's print view (`printView.ts`), which includes collapsed messages.
- **`src/content/SidebarHost.tsx`**: the sidebar is a React + MUI app in a shadow root. Navigation rules are in `src/content/index.tsx`.
- **`src/background/service-worker.ts`**: makes the LLM calls (`src/services/llm.ts`).
- **`src/options/`**: the settings page.

## Gmail gotchas

- Gmail's main world enforces Trusted Types, so `innerHTML` and `DOMParser` fail there. The content script's isolated world is fine.
- Gmail's class names are obfuscated and change. Keep selectors in `selectors.ts` with fallbacks, and document what each one targets.

## Conventions (from the project owner)

- **Privacy:** no third-party network calls besides the user's chosen LLM provider. No telemetry, no InboxSDK, no intercepting Gmail's network traffic.
- **Don't change what the user sees on Gmail.** The one exception is the Reply, Reply all and Compose clicks needed to insert a draft.
- **Avoid `useEffect`**; react to events in handlers instead.
- **Simple and robust beats clever.** No hacky CSS that might break across platforms.
- **Styling:**
  - Use MUI and Material components and variants first, with shared defaults in `src/theme.ts`.
  - Name custom styles as `styled()` components in a sibling `*.styles.ts` file.
  - Use SCSS (`src/styles/_tokens.scss`) only for DOM outside React: Gmail's page and the shadow host.
- **Plan first:** for larger changes, propose options with a recommendation and draft a plan before building.
- **Commits:** the owner commits. Don't commit unless asked.
