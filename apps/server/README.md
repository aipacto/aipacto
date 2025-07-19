# Aipacto Server with Better Auth

This server has been updated to use Better Auth for authentication instead of Clerk.

## Features

- **Better Auth Integration**: Complete authentication system with email/password
- **SQLite Database**: Local database for user management
- **Session Management**: Secure session handling with cookies
- **API Routes**: All routes are now under `/api` prefix
- **Same Port as Web**: Server runs on port 3000 alongside the web app

## Setup

1. **Install dependencies**:

   ```bash
   yarn install
   ```

2. **Set up environment variables**:

   ```bash
   cp env.example .env
   ```

   Edit `.env` and set:
   - `BETTER_AUTH_SECRET`: A random secret key for encryption
   - `BETTER_AUTH_URL`: The base URL (<http://localhost:3000>)

3. **Generate a secret key** (optional):

   ```bash
   openssl rand -base64 32
   ```

4. **Run database migrations**:

   ```bash
   npx @better-auth/cli migrate
   ```

5. **Start the server**:

   ```bash
   yarn start
   ```

## API Endpoints

### Authentication

- `POST /api/auth/sign-up/email` - User registration
- `POST /api/auth/sign-in/email` - User login
- `POST /api/auth/sign-out` - User logout
- `GET /api/auth/session` - Get current session

### Agents

- `POST /api/agents/supervisor` - Supervisor agent
- `POST /api/agents/impact` - Impact agent
- `POST /api/agents/planner` - Planner agent
- `POST /api/agents/simplifier` - Simplifier agent
- `POST /api/agents/summarizer` - Summarizer agent

### Threads

- `POST /api/threads` - Create/get thread
- `GET /api/threads/:threadId` - Get specific thread
- `POST /api/threads/:threadId/messages` - Add message to thread
- `DELETE /api/threads/:threadId` - Delete thread

### Documents

- `POST /api/documents/sync` - Sync document
- `GET /api/documents/:documentId` - Get document
- `GET /api/documents/:documentId/history` - Get document history
- `POST /api/documents/:documentId/snapshot` - Create snapshot
- `POST /api/documents/:documentId/checkout` - Checkout version

## Authentication Flow

1. **Registration**: Users can sign up with email/password
2. **Login**: Users can sign in with email/password
3. **Session**: Sessions are managed via HTTP-only cookies
4. **Authorization**: All API routes require authentication

## Database

The server uses SQLite for user management. The database file (`auth.db`) is created automatically when you run the migrations.

## Development

- Server runs on `http://localhost:3000`
- API endpoints are available at `http://localhost:3000/api/*`
- Authentication endpoints at `http://localhost:3000/api/auth/*`
