import React from "react";
import { Link } from "react-router-dom";

interface PublicHeaderProps {
  actions?: React.ReactNode;
}

const PublicHeader: React.FC<PublicHeaderProps> = ({ actions }) => (
  <header className="border-b">
    <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center">
      <Link to="/">
        <img src="/logoipsum-custom-logo.svg" alt="Pixera" className="h-8" />
      </Link>
      <div className="flex-1" />
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  </header>
);

export default PublicHeader;
