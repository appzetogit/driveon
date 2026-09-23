import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  MdDashboard,
  MdPeople,
  MdBadge,
  MdDirectionsCar,
  MdEventNote,
  MdBuild,
  MdStore,
  MdAttachMoney,
  MdBarChart,
  MdImportExport,
  MdSettings,
  MdKeyboardArrowDown,
  MdKeyboardArrowRight,
  MdKeyboardArrowLeft,
  MdCircle
} from 'react-icons/md';
import { premiumColors } from '../../theme/colors';
import { rgba } from 'polished';
import { useAdminAuth } from '../../context/AdminContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { adminUser } = useAdminAuth();
  const [expandedMenus, setExpandedMenus] = useState(['Enquiries', 'Staff Operations', 'Garage', 'Vendors']); // Default expand all dropdown submenus

  const toggleSubmenu = (name) => {
    if (expandedMenus.includes(name)) {
      setExpandedMenus(expandedMenus.filter(item => item !== name));
    } else {
      setExpandedMenus([...expandedMenus, name]);
    }
  };

  const menuItems = [
    {
      id: 'dashboard',
      path: '/crm/dashboard',
      name: 'Dashboard',
      icon: <MdDashboard />
    },
    {
      name: 'Enquiries',
      icon: <MdPeople />,
      id: 'Enquiries',
      subItems: [
        { path: '/crm/enquiries/all', name: 'All Enquiries' },
        { path: '/crm/enquiries/new', name: 'New' },
        { path: '/crm/enquiries/in-progress', name: 'In Progress' },
        { path: '/crm/enquiries/converted', name: 'Converted' },
        { path: '/crm/enquiries/closed', name: 'Closed' },
      ]
    },
    {
      name: 'Staff Operations',
      icon: <MdBadge />,
      id: 'Staff',
      subItems: [
        { path: '/crm/staff/directory', name: 'Staff Directory' },
        { path: '/crm/staff/roles', name: 'Roles & Designation' },
        { path: '/crm/staff/attendance', name: 'Attendance Tracker' },
        { path: '/crm/staff/attendance-settings', name: 'Attendance Settings' },
        { path: '/crm/staff/salary', name: 'Salary Management' },
      ]
    },


    {
      name: 'Garage',
      icon: <MdBuild />,
      id: 'Garage',
      subItems: [
        { path: '/crm/garage/all', name: 'All Garages' },
        { path: '/crm/garage/active', name: 'Active Repairs' },

        // { path: '/crm/garage/parts', name: 'Parts Cost' },

      ]
    },
    {
      name: 'Vendors',
      icon: <MdStore />,
      id: 'Vendors',
      subItems: [
        { path: '/crm/vendors/all', name: 'All Vendors' },

        // { path: '/crm/vendors/history', name: 'Vendor History' },

      ]
    },
    {
      name: 'App Policies',
      icon: <MdSettings />,
      id: 'Policies',
      subItems: [
        { path: '/crm/policies/privacy', name: 'Employee Privacy Policy' },
        { path: '/crm/policies/terms', name: 'Employee Terms' },
      ]
    },
    {
      name: 'Expense Tracker',
      icon: <MdAttachMoney />,
      id: 'Expenses',
      subItems: [
        { path: '/crm/expenses/track', name: 'Track Expenses' },
        { path: '/crm/expenses/categories', name: 'Categories' },
      ]
    },
    {
      id: 'driver-record',
      path: '/crm/staff/driver-record',
      name: 'Driver Record',
      icon: <MdBadge />
    },
    {
      id: 'employee-support',
      path: '/crm/staff/employee-support',
      name: 'Employee Support',
      icon: <MdSettings />
    },
    {
      id: 'upcoming-cars-screen',
      path: '/crm/upcoming-cars-screen',
      name: 'Screen',
      icon: <MdDirectionsCar />
    },
  ];

  const filterCRMMenuItems = (items, user) => {
    if (!user || user.role !== 'subadmin') return items;
    const permissions = user.permissions || [];

    return items
      .map(item => {
        if (item.subItems) {
          const filteredSub = item.subItems.filter(sub => {
            const keyMap = {
              '/crm/enquiries/all': 'crm:enquiries-all',
              '/crm/enquiries/new': 'crm:enquiries-new',
              '/crm/enquiries/in-progress': 'crm:enquiries-in-progress',
              '/crm/enquiries/converted': 'crm:enquiries-converted',
              '/crm/enquiries/closed': 'crm:enquiries-closed',
              '/crm/staff/directory': 'crm:staff-directory',
              '/crm/staff/roles': 'crm:staff-roles',
              '/crm/staff/attendance': 'crm:staff-attendance',
              '/crm/staff/attendance-settings': 'crm:staff-attendance-settings',
              '/crm/staff/salary': 'crm:staff-salary',
              '/crm/garage/all': 'crm:garage-all',
              '/crm/garage/active': 'crm:garage-active',
              '/crm/vendors/all': 'crm:vendors-all',
              '/crm/policies/privacy': 'crm:policies-privacy',
              '/crm/policies/terms': 'crm:policies-terms',
              '/crm/expenses/track': 'crm:expenses-track',
              '/crm/expenses/categories': 'crm:expenses-categories',
            };
            const key = keyMap[sub.path];
            return key ? permissions.includes(key) : false;
          });

          if (filteredSub.length === 0) return null;
          return { ...item, subItems: filteredSub };
        } else {
          const keyMap = {
            '/crm/dashboard': 'crm:dashboard',
            '/crm/staff/driver-record': 'crm:driver-record',
            '/crm/staff/employee-support': 'crm:employee-support',
          };
          const key = keyMap[item.path || item.id];
          if (!key) return item;
          const hasAccess = permissions.includes(key);
          return hasAccess ? item : null;
        }
      })
      .filter(Boolean);
  };

  const filteredMenuItems = filterCRMMenuItems(menuItems, adminUser);

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen transition-all duration-300 transform bg-white border-r border-gray-200
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-64 md:w-64`}
      style={{ borderColor: premiumColors.border.light }}
    >
      <div className="h-full flex flex-col">
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-center border-b border-gray-200 px-6 shrink-0">
          <h1 className="text-xl font-bold" style={{ color: premiumColors.primary.DEFAULT }}>
            DriveOn <span className="text-sm font-normal text-gray-500">CRM</span>
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hide">
          {filteredMenuItems.map((item) => {
            // Check if any child is active to highlight parent
            const isChildActive = item.subItems?.some(sub => location.pathname === sub.path);
            const isExpanded = expandedMenus.includes(item.name);

            if (item.subItems) {
              return (
                <div key={item.name} className="space-y-1">
                  {/* Parent Item */}
                  <button
                    onClick={() => toggleSubmenu(item.name)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group
                        ${isChildActive ? 'font-bold' : 'font-semibold text-gray-700 hover:bg-gray-50'}
                      `}
                    style={isChildActive ? {
                      backgroundColor: rgba(premiumColors.primary.DEFAULT, 0.08),
                      color: premiumColors.primary.DEFAULT
                    } : {}}
                  >
                    <div className="flex items-center">
                      <span className={`text-xl mr-3 transition-transform ${isChildActive ? '' : 'text-gray-500'}`} style={isChildActive ? { color: premiumColors.primary.DEFAULT } : {}}>
                        {item.icon}
                      </span>
                      <span className="text-sm tracking-wide">{item.name}</span>
                    </div>
                    <span className="text-gray-400">
                      {isExpanded ? <MdKeyboardArrowDown /> : <MdKeyboardArrowRight />}
                    </span>
                  </button>

                  {/* Submenu */}
                  <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="ml-4 pl-4 border-l-2 border-gray-100 space-y-1 py-1">
                      {item.subItems.map((sub) => {
                        // Level 3 Nesting Support
                        if (sub.subItems) {
                          const isSubExpanded = expandedMenus.includes(sub.name);
                          return (
                            <div key={sub.name} className="space-y-1 mt-2 mb-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSubmenu(sub.name);
                                }}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all font-semibold"
                              >
                                <div className="flex items-center">
                                  <span className="mr-2 opacity-50 text-[6px]"><MdCircle /></span>
                                  {sub.name}
                                </div>
                                <span className="text-gray-400 scale-75">
                                  {isSubExpanded ? <MdKeyboardArrowDown /> : <MdKeyboardArrowRight />}
                                </span>
                              </button>

                              <div className={`overflow-hidden transition-all duration-300 ml-3 pl-3 border-lborder-gray-100 ${isSubExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                {sub.subItems.map((child) => (
                                  <NavLink
                                    key={child.path}
                                    to={child.path}
                                    className={({ isActive }) =>
                                      `flex items-center px-3 py-1.5 rounded-lg text-xs transition-all my-0.5
                                              ${isActive
                                        ? 'font-bold'
                                        : 'font-semibold text-gray-600 hover:text-gray-900'
                                      }`
                                    }
                                    style={({ isActive }) => isActive ? {
                                      backgroundColor: rgba(premiumColors.primary.DEFAULT, 0.08),
                                      color: premiumColors.primary.DEFAULT
                                    } : {}}
                                  >
                                    <span className="mr-2 opacity-30 text-[4px]"><MdCircle /></span>
                                    {child.name}
                                  </NavLink>
                                ))}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <NavLink
                            key={sub.path}
                            to={sub.path}
                            className={({ isActive }) =>
                              `flex items-center px-3 py-2 rounded-lg text-sm transition-all
                                  ${isActive
                                ? 'font-bold'
                                : 'font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                              }`
                            }
                            style={({ isActive }) => isActive ? {
                              backgroundColor: rgba(premiumColors.primary.DEFAULT, 0.08),
                              color: premiumColors.primary.DEFAULT
                            } : {}}
                          >
                            <span className="mr-2 opacity-50 text-[6px]"><MdCircle /></span>
                            {sub.name}
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <NavLink
                key={item.id || item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive
                    ? 'font-bold shadow-sm'
                    : 'font-semibold hover:bg-gray-50 text-gray-700'
                  }`
                }
                style={({ isActive }) => isActive ? {
                  color: premiumColors.primary.DEFAULT,
                  backgroundColor: rgba(premiumColors.primary.DEFAULT, 0.08)
                } : {}}
              >
                <span className="text-xl mr-3 group-hover:scale-110 transition-transform">
                  {item.icon}
                </span>
                <span className="text-sm tracking-wide">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile / Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 shrink-0">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 ml-1">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                <span className="text-gray-500 font-bold">A</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Admin</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
