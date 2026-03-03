# AI Development Rules - Gestão Lions Arcoverde

## Tech Stack
*   **Frontend**: React 19 with TypeScript for robust type safety.
*   **Routing**: React Router 7 for single-page application navigation.
*   **Styling**: Tailwind CSS 4 for utility-first, responsive design.
*   **Backend**: Express.js (Node.js) serving as an API layer and static file host.
*   **Database**: Supabase (PostgreSQL) for persistent storage of tables (mesas, senhas, usuarios).
*   **Animations**: Motion (motion/react) for smooth UI transitions and interactions.
*   **Icons**: Lucide React for a consistent and modern icon set.
*   **Reporting**: jsPDF and jspdf-autotable for PDF generation; html-to-image for PNG exports.
*   **Build Tool**: Vite for high-performance development and bundling.

## Library Usage Rules
*   **Icons**: Exclusively use `lucide-react`. Do not introduce other icon libraries.
*   **Animations**: Use `motion` from `motion/react` for all transitions, modals, and hover effects.
*   **Styling**: Use Tailwind CSS classes for all layouts and components. Custom CSS should only be added to `src/index.css` for global utilities.
*   **Components**: Prioritize building small, focused functional components. Use `shadcn/ui` patterns for complex UI elements (buttons, inputs, dialogs).
*   **Data Fetching**: All backend communication must go through the `api` service defined in `src/services/api.ts`.
*   **State Management**: Use React's native `useState` and `useEffect` for local state. Avoid complex state management libraries unless the app scale significantly increases.
*   **PDFs**: Use `jspdf` combined with `jspdf-autotable` for all tabular reports.
*   **Exports**: Use `html-to-image` for capturing DOM elements (like the mesa map) as images.
*   **Database**: Always use the Supabase client within `server.ts` for database operations.

## Development Principles
*   **Responsiveness**: Every UI element must be mobile-friendly using Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`).
*   **Type Safety**: Always define interfaces in `src/types.ts` for data structures returned by the API.
*   **Simplicity**: Keep logic simple and elegant. Avoid over-engineering features.