/**
 * Skills domain router
 */
import {
  createSkillHandler,
  deleteSkillHandler,
  exportSkillHandler,
  getSkillHandler,
  importSkillHandler,
  listSkillsHandler,
  resetBuiltInSkillsHandler,
  updateSkillHandler,
} from './handlers';

export const skills = {
  list: listSkillsHandler,
  get: getSkillHandler,
  create: createSkillHandler,
  update: updateSkillHandler,
  delete: deleteSkillHandler,
  import: importSkillHandler,
  export: exportSkillHandler,
  resetBuiltIn: resetBuiltInSkillsHandler,
};
