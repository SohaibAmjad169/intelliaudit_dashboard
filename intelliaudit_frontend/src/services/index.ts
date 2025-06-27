/**
 * Services Module Index
 * 
 * This file exports all services from a centralized location, making it easier
 * to import services throughout the application.
 * 
 * +++ CORE CONCEPT +++
 * Service consolidation improves maintainability by providing a single source
 * of truth for each type of service functionality. This reduces duplication
 * and makes the codebase easier to maintain and update.
 * +++ CORE CONCEPT +++
 */

// Common services
export { apiClient } from './common/api-client';
export { API_CONFIG, getEndpoint } from './common/api-config';

// AI services - removing projectsApi import as it uses legacy mappers
// export { projectsApi } from './ai/services/projects';

// Company services
export { companyAssetsService, getCompanyLogo } from './company';

// Equipment services
export { equipmentService } from './equipment';

// Photos services
export { photoService } from './photos';

// Project services 
export { 
  getProjects,
  getProject,
  getProjectWithDetails,
  createProject,
  updateProject,
  deleteProject
} from './projects';

// Reports services
export { reportService, reportsService } from './reports';

// Note: The following modules need to be created or imported directly
// - energy-analysis
// - measures (doesn't exist yet)
// - users (doesn't exist yet)
// - water-audit (doesn't exist yet)

export { fieldNotesService } from './field-notes';
