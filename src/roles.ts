/** A small set of standard Plone roles for the POC. */
export interface Role {
  id: string;
  label: string;
  color: string;
}

export const ROLES: Role[] = [
  { id: 'Manager', label: 'Manager', color: '#ef4444' },
  { id: 'Reviewer', label: 'Reviewer', color: '#8b5cf6' },
  { id: 'Member', label: 'Member', color: '#0ea5e9' },
  { id: 'Owner', label: 'Owner', color: '#ec4899' },
  { id: 'Anonymous', label: 'Anonymous', color: '#94a3b8' },
];

const ROLE_INDEX = new Map(ROLES.map((r) => [r.id, r]));

export const roleById = (id: string): Role | undefined => ROLE_INDEX.get(id);
