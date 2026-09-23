const adminPathMap = [
  { path: '/admin/dashboard', key: 'admin:dashboard' },
  { path: '/admin/users', key: 'admin:users' },
  { path: '/admin/guarantors', key: 'admin:guarantors' },
  { path: '/admin/cars/add-outward', key: 'admin:add-outward-car' },
  { path: '/admin/cars', key: 'admin:cars' },
  { path: '/admin/online-cars', key: 'admin:online-cars' },
  { path: '/admin/fleet/inward-bookings', key: 'admin:fleet-inward-bookings' },
  { path: '/admin/fleet/inward', key: 'admin:fleet-inward' },
  { path: '/admin/bookings/driver-assignment', key: 'admin:driver-assignment' },
  { path: '/admin/bookings', key: 'admin:bookings' },
  { path: '/admin/payments', key: 'admin:payments' },
  { path: '/admin/cash-payments', key: 'admin:cash-payments' },
  { path: '/admin/tracking', key: 'admin:tracking' },
  { path: '/admin/referrals', key: 'admin:referrals' },
  { path: '/admin/offers', key: 'admin:offers' },
  { path: '/admin/coupons', key: 'admin:coupons' },
  { path: '/admin/addon-services', key: 'admin:addon-services' },
  { path: '/admin/support', key: 'admin:support' },
  { path: '/admin/policies', key: 'admin:privacy-policy' },
  { path: '/admin/settings', key: 'admin:settings' },
  { path: '/admin/profile', key: 'public' },
];

const crmPathMap = [
  { path: '/crm/dashboard', key: 'crm:dashboard' },
  { path: '/crm/enquiries/all', key: 'crm:enquiries-all' },
  { path: '/crm/enquiries/new', key: 'crm:enquiries-new' },
  { path: '/crm/enquiries/in-progress', key: 'crm:enquiries-in-progress' },
  { path: '/crm/enquiries/converted', key: 'crm:enquiries-converted' },
  { path: '/crm/enquiries/closed', key: 'crm:enquiries-closed' },
  { path: '/crm/enquiries', key: 'crm:enquiries-all' },
  { path: '/crm/staff/directory', key: 'crm:staff-directory' },
  { path: '/crm/staff/roles', key: 'crm:staff-roles' },
  { path: '/crm/staff/attendance-settings', key: 'crm:staff-attendance-settings' },
  { path: '/crm/staff/attendance', key: 'crm:staff-attendance' },
  { path: '/crm/staff/salary', key: 'crm:staff-salary' },
  { path: '/crm/staff/driver-record', key: 'crm:driver-record' },
  { path: '/crm/staff', key: 'crm:staff-directory' },
  { path: '/crm/garage/all', key: 'crm:garage-all' },
  { path: '/crm/garage/active', key: 'crm:garage-active' },
  { path: '/crm/garage', key: 'crm:garage-active' },
  { path: '/crm/vendors/all', key: 'crm:vendors-all' },
  { path: '/crm/vendors', key: 'crm:vendors-all' },
  { path: '/crm/policies/privacy', key: 'crm:policies-privacy' },
  { path: '/crm/policies/terms', key: 'crm:policies-terms' },
  { path: '/crm/policies', key: 'crm:policies-privacy' },
  { path: '/crm/expenses/track', key: 'crm:expenses-track' },
  { path: '/crm/expenses/categories', key: 'crm:expenses-categories' },
  { path: '/crm/expenses', key: 'crm:expenses-track' },
];

/**
 * Validates path permissions for a subadmin user
 * @param {string} pathname 
 * @param {string} role 
 * @param {string[]} permissions 
 * @returns {boolean}
 */
export const checkPathPermission = (pathname, role, permissions = []) => {
  if (role !== 'subadmin') return true;

  // Admin profile page is always public
  if (pathname === '/admin/profile' || pathname === '/admin/sub-admins') return true;

  if (pathname.startsWith('/admin')) {
    const matched = [...adminPathMap]
      .sort((a, b) => b.path.length - a.path.length)
      .find(item => pathname.startsWith(item.path));

    if (matched) {
      if (matched.key === 'public') return true;
      return permissions.includes(matched.key);
    }
    return false;
  }

  if (pathname.startsWith('/crm')) {
    // Check enquiries details sub-path (details page doesn't map to single key)
    if (pathname.startsWith('/crm/enquiries/') && 
        !['all', 'new', 'in-progress', 'converted', 'closed'].includes(pathname.split('/')[3])) {
      return permissions.some(p => p.startsWith('crm:enquiries-'));
    }

    const matched = [...crmPathMap]
      .sort((a, b) => b.path.length - a.path.length)
      .find(item => pathname.startsWith(item.path));

    if (matched) {
      return permissions.includes(matched.key);
    }
    return false;
  }

  return true;
};
