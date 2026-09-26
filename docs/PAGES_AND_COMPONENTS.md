# HABIT//PULSE: Application Pages, Components & Architecture

## Overview
**HABIT//PULSE** is a full-stack, cyber-zen aesthetic habit tracking application powered by React, TypeScript, Vite, and Supabase. The application enforces complete tenant isolation via PostgreSQL Row Level Security (RLS), graceful fault tolerance through React Error Boundaries, and avatar management with client-side validation and Supabase Storage policies.

---

## 1. Application Pages

### A. Login Page (`/login`) — `src/pages/LoginPage.tsx`
* **Route:** `/login`
* **Features:**
  * Clean, high-contrast cyber-zen white background with emerald/neon accents (`#00e676`, `#059669`).
  * Email and password authentication via `supabase.auth.signInWithPassword`.
  * Context-aware error handling (e.g. unconfirmed email detection with actionable guidance).
  * Auto-redirects already-authenticated users to `/`.

### B. Signup Page (`/signup`) — `src/pages/SignupPage.tsx`
* **Route:** `/signup`
* **Features:**
  * Email, password, and confirm password fields with client-side matching validation.
  * Direct session detection: automatically logs user in and navigates directly to `/` if email confirmation is disabled.
  * Helpful inline alert if email confirmation is enabled in Supabase.

### C. Tracker Dashboard (`/`) — `src/pages/TrackerPage.tsx`
* **Route:** `/` (Protected by `<ProtectedRoute />`)
* **Features:**
  * Displays today's formatted date badge.
  * Daily habit completion progress bar with percentage and counter.
  * Habit filtering: All, Pending, Completed.
  * Habit cards with toggleable completion status, flame streak counter, edit modal, and delete confirmation modal.
  * Profile avatar integration in the navigation bar.
  * **Major sections protected by independent Error Boundaries.**
  * Built-in developer audit controls to test section error recovery without page crash.

---

## 2. Reusable UI Components

### A. `ErrorBoundary.tsx` (`src/components/ErrorBoundary.tsx`)
* **Pattern:** Hand-written React Class Component.
* **Lifecycle Methods:**
  * `static getDerivedStateFromError(error: Error)`: Catches render errors and activates fallback UI state.
  * `componentDidCatch(error: Error, errorInfo: ErrorInfo)`: Logs error details and diagnostics.
* **Props:**
  * `sectionName?: string`: Displays name of isolated broken section.
  * `fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode)`: Optional custom UI.
  * `onReset?: () => void`: Callback triggered when user clicks "Try again".
* **Resilience:** If one section crashes (e.g. Navigation, Statistics, or Habit List), only that section displays the error card; the rest of the application remains fully interactive and functional.

### B. `AvatarUploadModal.tsx` (`src/components/AvatarUploadModal.tsx`)
* **Features:**
  * Hand-written file input validation before uploading.
  * Refuses files $> 1\text{ MB}$ with explicit inline error: `File size (X MB) exceeds the 1 MB limit. Please select a smaller photo.`
  * Refuses non-image MIME types (accepts PNG, JPG, WEBP, GIF).
  * Real-time image preview using `URL.createObjectURL(file)`.
  * Memory leak prevention with `URL.revokeObjectURL(previewUrl)` on unmount and file change.
  * Uploads to Supabase storage with `upsert: true` to replace the user's avatar without duplicating files.
  * Saves public avatar URL to `public.profiles.avatar_url`.

### C. `Navbar.tsx` (`src/components/Navbar.tsx`)
* **Features:**
  * Logo with neon pulse icon.
  * Today's habit progress badge (`completedCount / totalCount DONE`).
  * User profile pill displaying email, avatar thumbnail, and camera icon.
  * Clicking user pill opens the `AvatarUploadModal`.
  * Sign out button with confirmation.

### D. `HabitCard.tsx` (`src/components/HabitCard.tsx`)
* **Features:**
  * Neon completion toggle button with smooth micro-animation.
  * Streak flame badge (`🔥 X DAYS`).
  * Frequency tag and goal target.
  * Edit and delete action buttons.

### E. `HabitModal.tsx` (`src/components/HabitModal.tsx`)
* **Features:**
  * Modal for creating new habits and editing existing habits.
  * Validates habit name (required), target streak ($\ge 1$), and frequency.

### F. `DeleteModal.tsx` (`src/components/DeleteModal.tsx`)
* **Features:**
  * Prominent cascade warning: *"Deleting this habit will permanently remove all associated daily completion logs. This action cannot be undone."*
  * Prevents accidental habit loss.

### G. `EmptyState.tsx` (`src/components/EmptyState.tsx`)
* **Features:**
  * Displayed when a user has 0 habits (e.g. fresh account).
  * Explains privacy and RLS isolation.
  * Direct action button: `+ Create Your First Habit`.

### H. `ProtectedRoute.tsx` (`src/components/ProtectedRoute.tsx`)
* **Features:**
  * Guards `/` from unauthenticated visitors.
  * Displays loading spinner while rehydrating session from Supabase, preventing redirect flicker on refresh.
  * Redirects unauthenticated users to `/login`.

---

## 3. State Management & Custom Hooks

* **`useAuth` (`src/context/AuthContext.tsx`):**
  * Subscribes to `supabase.auth.onAuthStateChange`.
  * Exposes `user`, `session`, `loading`, `signIn`, `signUp`, `signOut`.
* **`useHabits` (`src/hooks/useHabits.ts`):**
  * CRUD methods for `habits` and `daily_logs`.
  * Optimistic UI toggling for today's logs.
  * Calculates current streaks.
* **`useProfile` (`src/hooks/useProfile.ts`):**
  * Fetches `avatar_url` from `profiles` table.
  * Handles avatar file validation and storage upload.
  * Implements cache-busting timestamp (`?t=...`) to ensure immediate browser rendering of replaced avatars.
