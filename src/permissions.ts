/**
 * A small set of standard Plone/CMF permissions for the POC, the ones commonly
 * used as DCWorkflow transition guards (guard_permissions). In Plone the guard
 * stores the permission *title* string, so we use it as the id.
 */
export interface Permission {
  id: string;
  label: string;
  /** The Zope permission id, shown for reference. */
  zope: string;
}

export const PERMISSIONS: Permission[] = [
  { id: 'Review portal content', label: 'Review portal content', zope: 'cmf.ReviewPortalContent' },
  { id: 'Request review', label: 'Request review', zope: 'cmf.RequestReview' },
  { id: 'Modify portal content', label: 'Modify portal content', zope: 'cmf.ModifyPortalContent' },
  { id: 'View', label: 'View', zope: 'zope2.View' },
];

const PERMISSION_INDEX = new Map(PERMISSIONS.map((p) => [p.id, p]));

export const permissionById = (id: string): Permission | undefined =>
  PERMISSION_INDEX.get(id);
