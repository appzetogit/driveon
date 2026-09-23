import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

const EmployeeLayout = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <Outlet />
    </>
  );
};

export default EmployeeLayout;
