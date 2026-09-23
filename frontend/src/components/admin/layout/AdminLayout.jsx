import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { colors } from '../../../module/theme/colors';
import { useAdminAuth } from '../../../context/AdminContext';
import { checkPathPermission } from '../../../utils/permissions';
import AccessDenied from '../../common/AccessDenied';

/**
 * Admin Layout Component
 * Main layout wrapper for all admin pages
 * Includes Sidebar and Header
 * No localStorage - All state managed via React hooks
 * Updated to use new module theme
 */
const AdminLayout = () => {
  const location = useLocation();
  const { adminUser } = useAdminAuth();
  const hasAccess = checkPathPermission(location.pathname, adminUser?.role, adminUser?.permissions);
  return (
    <>
      {/* Global Styles for Admin Panel Select/Dropdown Elements */}
      <style>{`
/* Admin Panel Select/Dropdown Styling - Theme Colors - High Specificity */
div.admin - panel select,
        .admin - panel select,
  body.admin - panel select,
    main select,
      body main select,
        [class*= "admin"] select,
          body[class*= "admin"] select,
            div[class*= "admin"] select {
  background - color: ${colors.backgroundSecondary} !important;
  background - image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23000000' d='M6 9L1 4h10z'/%3E%3C/svg%3E")!important;
  background - repeat: no - repeat!important;
  background - position: right 0.5rem center!important;
  background - size: 1em 1em!important;
  color: ${colors.textPrimary} !important;
  border: 1px solid ${colors.borderMedium} !important;
  border - color: ${colors.borderMedium} !important;
  -webkit - appearance: none!important;
  -moz - appearance: none!important;
  appearance: none!important;
  padding - right: 2.5rem!important;
}

div.admin - panel select: focus,
        .admin - panel select: focus,
  body.admin - panel select: focus,
    main select: focus,
      body main select: focus,
        [class*= "admin"] select: focus,
          body[class*= "admin"] select:focus {
  outline: none!important;
  border - color: ${colors.backgroundTertiary} !important;
  box - shadow: 0 0 0 2px ${colors.shadowFocus} !important;
}

div.admin - panel select: hover,
        .admin - panel select: hover,
  body.admin - panel select: hover,
    main select: hover,
      body main select: hover,
        [class*= "admin"] select: hover,
          body[class*= "admin"] select:hover {
  border - color: ${colors.borderLight} !important;
}

/* Option Styling - Browser native dropdown options */
div.admin - panel select option,
        .admin - panel select option,
  body.admin - panel select option,
    main select option,
      body main select option,
        [class*= "admin"] select option,
          body[class*= "admin"] select option {
  background - color: ${colors.backgroundSecondary} !important;
  color: ${colors.textPrimary} !important;
  padding: 0.5rem 0.75rem!important;
}

/* Selected option in dropdown list */
div.admin - panel select option: checked,
        .admin - panel select option: checked,
  body.admin - panel select option: checked,
    main select option: checked,
      body main select option: checked,
        [class*= "admin"] select option: checked,
          body[class*= "admin"] select option:checked {
  background - color: ${colors.backgroundTertiary} !important;
  background: ${colors.backgroundTertiary} !important;
  color: ${colors.textWhite} !important;
}

/* Hover state for options (limited browser support) */
div.admin - panel select option: hover,
        .admin - panel select option: hover,
  body.admin - panel select option: hover,
    main select option: hover,
      body main select option: hover,
        [class*= "admin"] select option: hover,
          body[class*= "admin"] select option:hover {
  background - color: ${colors.backgroundTertiary} !important;
  background: ${colors.backgroundTertiary} !important;
  color: ${colors.textWhite} !important;
}

/* Active/Focus state */
div.admin - panel select: active,
        .admin - panel select: active,
  body.admin - panel select:active {
  border - color: ${colors.backgroundTertiary} !important;
}
`}</style>

      <div
        className="min-h-screen flex overflow-x-hidden max-w-full admin-panel"
        style={{ backgroundColor: colors.backgroundPrimary }}
      >
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main Content Area */}
        <div className="flex-1 lg:ml-64 min-w-0 overflow-x-hidden max-w-full">
          {/* Header */}
          <AdminHeader />

          {/* Page Content */}
          <main className="pt-16 min-h-screen overflow-x-hidden max-w-full">
            <div className="w-full max-w-full overflow-x-hidden">
              {hasAccess ? <Outlet /> : <AccessDenied />}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default AdminLayout;

