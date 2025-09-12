import { PlusCircle } from "lucide-react";

export function EmptyState({
  onCreateProject,
}: {
  onCreateProject: () => void;
}) {
  return (
    <div className="text-center py-20">
      <div className="max-w-md mx-auto">
        <div className="mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <PlusCircle className="w-12 h-12 text-title" />
          </div>
          <h2 className="text-2xl font-bold text-title mb-2">
            No projects yet
          </h2>
          <p className="text-subtitle mb-8">
            Get started by creating your first project and organizing your
            tasks.
          </p>
        </div>
        <button
          onClick={onCreateProject}
          className="inline-flex items-center gap-2 bg-btn-primary text-white px-6 py-3 rounded-lg  font-medium"
        >
          <PlusCircle size={20} />
          Create Your First Project
        </button>
      </div>
    </div>
  );
}
