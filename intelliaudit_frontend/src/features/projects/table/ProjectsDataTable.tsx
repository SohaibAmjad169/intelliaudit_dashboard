import { useState } from "react";
import { 
  ColumnDef, 
  flexRender, 
  getCoreRowModel, 
  getPaginationRowModel, 
  getSortedRowModel, 
  SortingState, 
  useReactTable, 
  ColumnFiltersState, 
  getFilteredRowModel 
} from "@tanstack/react-table";
import { MoreHorizontal, Loader2, Settings, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Project, getStatusLabel, PROJECT_STATUS_COLORS } from "@/types/project";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { DeleteConfirmationModal } from "@shared/modals/DeleteConfirmationModal";
import { deleteProject } from "@/services/projects";
import { Link } from "react-router-dom";
import { apiClient } from "@/services/common/api-client";
import { useToast } from "@/components/ui/use-toast";

interface ProjectsDataTableProps {
  data: Project[];
  onRefresh: () => void;
}

export function ProjectsDataTable({ data, onRefresh }: ProjectsDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [generatingContext, setGeneratingContext] = useState<Record<string, boolean>>({});

  const handleGenerateContext = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setGeneratingContext(prev => ({ ...prev, [projectId]: true }));
    
    try {
      const response = await apiClient.post(`/ai-command/project/${projectId}/generate-context`);
      toast({
        title: "Context Generated",
        description: `AI context generated successfully for project ${projectId}.`,
      });
    } catch (error: any) {
      console.error("Error generating context:", error);
      toast({
        title: "Error Generating Context",
        description: error.response?.data?.message || error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setGeneratingContext(prev => ({ ...prev, [projectId]: false }));
    }
  };

  const handleDelete = async () => {
    if (!selectedProject) return;
    
    try {
      await deleteProject(selectedProject.id);
      await onRefresh();
    } catch (error) {
      console.error('Failed to delete project:', error);
    } finally {
      setShowDeleteModal(false);
      setSelectedProject(null);
    }
  };

  const columns: ColumnDef<Project>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
              ? "indeterminate"
              : false
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Project Name",
      cell: (info) => {
        const project = info.row.original;
        return (
          <div className="flex items-center">
            <Link
              to={`/projects/${project.id}`}
              state={{ projectId: project.id }}
              className="text-sm font-medium hover:underline"
            >
              {project.name}
            </Link>
          </div>
        );
      },
    },
    {
      accessorKey: "company_name",
      header: "Customer",
      cell: ({ row }) => <div>{row.getValue("company_name")}</div>,
    },
    {
      accessorKey: "building_address",
      header: "Location",
      cell: ({ row }) => <div>{row.getValue("building_address")}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const statusLabel = getStatusLabel(status as any);
        const colorKey = status as keyof typeof PROJECT_STATUS_COLORS;
        const color = PROJECT_STATUS_COLORS[colorKey] || "gray";
        
        return (
          <Badge variant={color as any} className="capitalize">
            {statusLabel}
          </Badge>
        );
      },
    },
    {
      id: "aiContext",
      header: "AI Context",
      cell: ({ row }) => {
        const project = row.original;
        const isGenerating = generatingContext[project.id];
        const hasContext = Boolean(project.ai_context);

        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => handleGenerateContext(project.id, e)}
              disabled={isGenerating}
              title={hasContext ? "Regenerate AI Context" : "Generate AI Context"}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Settings className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">{hasContext ? "Regen" : "Generate"}</span>
            </Button>
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const project = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/projects/${project.id}`, {
                    state: { project, projectId: project.id }
                  });
                }}
              >
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Edit Project</DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive" 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedProject(project);
                  setShowDeleteModal(true);
                }}
              >
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter projects..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Button variant="outline" onClick={onRefresh} className="ml-auto">
          Refresh
        </Button>
      </div>
      <div className="rounded-md border dark:border-opacity-5">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    const project = row.original;
                    navigate(`/projects/${project.id}`, {
                      state: { project, projectId: project.id }
                    });
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No projects found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
      
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedProject(null);
        }}
        onConfirm={handleDelete}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone."
      />
    </div>
  );
} 