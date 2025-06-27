# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Test Commands
- Build: `npm run build`
- Start development server: `npm run dev`
- Lint: `npm run lint`
- Format code: `npm run format`
- Tests: `npm run test`
- Run a specific test: `npm run test -- -t "test name"` or `npx jest path/to/test.spec.ts`
- TypeCheck: `tsc --noEmit` (validates types without compiling)

## Code Style Guidelines
- **Imports**: Group by type (NestJS, third-party, local); sort alphabetically within groups
- **Formatting**: 2-space indentation, 100 char line limit, trailing commas in arrays/objects
- **Naming**: PascalCase - classes/interfaces/types, camelCase - variables/methods, ALL_CAPS - constants
- **Types**: Use explicit return types; prefer interfaces for objects, types for unions/aliases
- **Async/Await**: Always use async/await pattern instead of raw Promises
- **Error Handling**: Use try/catch with detailed error logging including error.stack
- **NestJS Patterns**: Follow module/controller/service architecture; use dependency injection
- **Documentation**: Use Swagger decorators; document all public APIs
- **Logging**: Use NestJS Logger with class name as context
- **Repository Pattern**: Use Prisma service for DB operations; handle transactions properly
- **Environment Variables**: Access via ConfigService; validate presence in bootstrap