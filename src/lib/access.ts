export const ADMIN_PANEL_ROLE_SLUGS = {
  superAdmin: 'super_admin',
  ngoAdmin: 'ngo_admin',
  ngoTeamMember: 'ngo_team_member',
} as const;

export function getAssignableUserRoleSlugs(currentUserRoles: string[] = []) {
  if (currentUserRoles.includes(ADMIN_PANEL_ROLE_SLUGS.superAdmin)) {
    return [
      ADMIN_PANEL_ROLE_SLUGS.superAdmin,
      ADMIN_PANEL_ROLE_SLUGS.ngoAdmin,
      ADMIN_PANEL_ROLE_SLUGS.ngoTeamMember,
    ];
  }

  if (currentUserRoles.includes(ADMIN_PANEL_ROLE_SLUGS.ngoAdmin)) {
    return [ADMIN_PANEL_ROLE_SLUGS.ngoTeamMember];
  }

  return [];
}
