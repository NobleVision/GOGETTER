# Implementation Plan: GO-GETTER OS Enhancements

## Overview

This implementation plan breaks down the GO-GETTER OS enhancements into discrete, incremental tasks. Each task builds on previous work and includes testing requirements. The plan prioritizes foundational work (environment, auth) before feature enhancements.

## Tasks

- [x] 1. Environment Configuration & Security Setup
  - [x] 1.1 Implement environment validation module
    - Create `server/_core/envValidation.ts` with validation functions
    - Add JWT_SECRET length validation (minimum 32 characters)
    - Add placeholder detection for "your-random-secret-key-here"
    - Add DATABASE_URL presence validation
    - Integrate validation into server startup in `server/_core/index.ts`
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 1.2 Write property test for JWT secret validation

    - **Property 1: JWT Secret Validation**
    - **Validates: Requirements 1.2, 1.3**
  - [x] 1.3 Generate and configure secure JWT_SECRET
    - Create utility function to generate cryptographically secure secrets
    - Update `.env.example` with instructions
    - Generate new JWT_SECRET for local development
    - _Requirements: 1.2_

- [x] 2. Google OAuth Authentication
  - [x] 2.1 Add Google OAuth dependencies and configuration
    - Add `google-auth-library` package
    - Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to env schema
    - Create `server/_core/googleOAuth.ts` service
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 2.2 Implement Google OAuth routes
    - Add `/api/oauth/google/init` route for authorization URL generation
    - Add `/api/oauth/google/callback` route for code exchange
    - Implement user profile retrieval from Google
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 2.3 Update user schema for multi-provider auth
    - Add `google_id`, `picture_url`, `auth_providers` columns to users table
    - Create Drizzle migration
    - Update `upsertUser` function to handle Google users
    - _Requirements: 2.4, 2.5, 8.2, 8.3_
  - [x] 2.4 Write property test for user record management

    - **Property 2: User Record Management on OAuth**
    - **Validates: Requirements 2.4, 2.5**
  - [x] 2.5 Write property test for session cookie round-trip

    - **Property 3: Session Cookie Round-Trip**
    - **Validates: Requirements 2.6, 2.8**
  - [x] 2.6 Create login page with Google sign-in button
    - Add Google sign-in button to login UI
    - Implement OAuth redirect flow on client
    - Handle authentication errors with user-friendly messages
    - _Requirements: 2.1, 2.7, 8.1_
  - [x] 2.7 Write property test for account linking by email

    - **Property 14: Account Linking by Email**
    - **Validates: Requirements 8.2, 8.3**

- [x] 3. Checkpoint - Authentication Complete
  - Ensure all auth tests pass
  - Verify Google OAuth flow works end-to-end
  - Ask the user if questions arise

- [x] 4. Discovery Presets Feature
  - [x] 4.1 Create discovery_presets database table
    - Add `discoveryPresets` table to Drizzle schema
    - Create migration with unique constraint on (user_id, name)
    - Add database query functions in `server/db.ts`
    - _Requirements: 5.1, 5.2_
  - [x] 4.2 Implement presets tRPC router
    - Add `presets` router with list, create, delete procedures
    - Implement 10-preset limit check
    - Add preset name uniqueness validation
    - _Requirements: 5.2, 5.5, 5.6, 5.7_
  - [x] 4.3 Write property test for preset name uniqueness

    - **Property 8: Preset Name Uniqueness**
    - **Validates: Requirements 5.2**
  - [x] 4.4 Write property test for preset count limit

    - **Property 10: Preset Count Limit Enforcement**
    - **Validates: Requirements 5.6, 5.7**
  - [x] 4.5 Update Wizard UI with preset functionality
    - Add "Save as Preset" button after wizard completion
    - Add preset selection dropdown at wizard start
    - Implement preset loading to populate wizard fields
    - Add preset deletion in settings or wizard
    - _Requirements: 5.1, 5.3, 5.4, 5.5_
  - [x] 4.6 Write property test for preset loading completeness

    - **Property 9: Preset Loading Completeness**
    - **Validates: Requirements 5.3, 5.4**

- [x] 5. Checkpoint - Presets Complete
  - Ensure all preset tests pass
  - Verify preset save/load cycle works
  - Ask the user if questions arise

- [x] 6. Go-Getter Agent with Real AI Execution
  - [x] 6.1 Create model router service
    - Create `server/services/modelRouter.ts`
    - Implement model selection by task type and cost
    - Add fallback logic for failed requests
    - _Requirements: 3.3, 3.6_
  - [ ]* 6.2 Write property test for model router cost optimization
    - **Property 5: Model Router Cost Optimization**
    - **Validates: Requirements 3.3**
  - [x] 6.3 Implement Go-Getter agent service
    - Create `server/services/goGetterAgent.ts`
    - Implement `discoverOpportunities` with AI API calls
    - Include user preferences in prompts (risk, interests, capital)
    - Implement composite scoring for discovered opportunities
    - _Requirements: 3.1, 3.2, 3.4_
  - [ ]* 6.4 Write property test for composite score consistency
    - **Property 4: Composite Score Calculation Consistency**
    - **Validates: Requirements 3.4**
  - [x] 6.5 Add token usage logging to agent
    - Log all AI interactions with model, tokens, cost
    - Integrate with existing tokenUsage table
    - _Requirements: 3.7_
  - [ ]* 6.6 Write property test for AI interaction logging
    - **Property 6: AI Interaction Logging Completeness**
    - **Validates: Requirements 3.7**
  - [x] 6.7 Add agent tRPC endpoint
    - Create `agent.discover` procedure
    - Handle fallback to static catalog when no APIs configured
    - Return scored business opportunities
    - _Requirements: 3.1, 3.5_
  - [x] 6.8 Update Wizard to use Go-Getter agent
    - Call agent.discover after wizard completion
    - Display AI-generated recommendations in catalog
    - Show loading state during AI processing
    - _Requirements: 3.1, 3.2_

- [ ] 7. Checkpoint - Agent Integration Complete
  - Ensure all agent tests pass
  - Verify AI-powered discovery works with configured APIs
  - Verify fallback to static catalog works
  - Ask the user if questions arise

- [ ] 8. Enhanced Monitoring Dashboard with Time-Series Charts
  - [ ] 8.1 Add time-series aggregation API
    - Create `events.timeSeries` tRPC procedure
    - Implement SQL aggregation by hour, day, week
    - Support time range filtering (24h, 7d, 30d, 90d)
    - Return revenue, costs, and profit data points
    - _Requirements: 7.3, 7.4_
  - [ ]* 8.2 Write property test for chart data time range filtering
    - **Property 7: Chart Data Time Range Filtering**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.5**
  - [ ]* 8.3 Write property test for event aggregation
    - **Property 13: Event Aggregation by Time Period**
    - **Validates: Requirements 7.3, 7.4**
  - [ ] 8.4 Update Monitoring page with real time-series charts
    - Replace mock chart data with real API data
    - Add time range selector (24h, 7d, 30d)
    - Display revenue trend chart with real data
    - Display token cost trend chart with real data
    - Add profit/loss trend line
    - _Requirements: 4.1, 4.2, 4.3, 4.5_
  - [ ] 8.5 Ensure event storage completeness
    - Verify revenue events store timestamp and amount
    - Verify cost events store timestamp and amount
    - Add validation in event logging
    - _Requirements: 7.1, 7.2_
  - [ ]* 8.6 Write property test for event storage completeness
    - **Property 12: Event Storage Completeness**
    - **Validates: Requirements 7.1, 7.2**

- [ ] 9. Token Usage Time-Series Enhancement
  - [ ] 9.1 Add token usage aggregation API
    - Create `tokenUsage.timeSeries` tRPC procedure
    - Implement aggregation by provider
    - Support daily, weekly, monthly groupings
    - _Requirements: 6.2, 6.3_
  - [ ]* 9.2 Write property test for token usage aggregation
    - **Property 11: Token Usage Aggregation Accuracy**
    - **Validates: Requirements 6.2, 6.3, 6.4**
  - [ ] 9.3 Update Token Usage page with charts
    - Add time-series chart for token costs
    - Add breakdown by model provider
    - Add budget warning when approaching limit
    - _Requirements: 6.4, 6.5_

- [ ] 10. Checkpoint - Monitoring Complete
  - Ensure all monitoring tests pass
  - Verify charts display real data
  - Verify time range filtering works
  - Ask the user if questions arise

- [ ] 11. Settings Page Enhancements
  - [ ] 11.1 Add linked providers display
    - Show which OAuth providers are linked to account
    - Display Google profile picture if available
    - _Requirements: 8.4_
  - [ ] 11.2 Add provider linking functionality
    - Allow linking additional OAuth providers
    - Handle account merge for same email
    - _Requirements: 8.2_

- [ ] 12. Final Integration & Polish
  - [ ] 12.1 Add error handling throughout
    - Implement error boundaries for auth failures
    - Add user-friendly error messages
    - Add retry logic for transient failures
    - _Requirements: 2.7, 1.4_
  - [ ] 12.2 Add loading states
    - Add skeleton loaders for charts
    - Add loading indicators for AI processing
    - Add progress feedback for long operations
  - [ ]* 12.3 Write integration tests
    - Test full OAuth flow
    - Test preset save/load cycle
    - Test agent discovery flow
    - Test chart data retrieval

- [ ] 13. Final Checkpoint
  - Ensure all tests pass
  - Verify all features work end-to-end
  - Review error handling and edge cases
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
