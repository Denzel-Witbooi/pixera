import React from "react";
import { Link } from "react-router-dom";
import { Images, FolderOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const AdminDashboard: React.FC = () => (
  <div>
    <h1 className="text-2xl font-semibold mb-2">Dashboard</h1>
    <p className="text-muted-foreground mb-8">Manage your albums and media.</p>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <Link to="/admin/albums">
          <CardHeader className="pb-2">
            <FolderOpen className="h-6 w-6 text-primary mb-1" />
            <CardTitle className="text-base">Albums</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Create and manage photo albums</CardDescription>
          </CardContent>
        </Link>
      </Card>

      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <Link to="/admin/media">
          <CardHeader className="pb-2">
            <Images className="h-6 w-6 text-primary mb-1" />
            <CardTitle className="text-base">Media</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Upload and organise photos and videos</CardDescription>
          </CardContent>
        </Link>
      </Card>
    </div>
  </div>
);

export default AdminDashboard;
