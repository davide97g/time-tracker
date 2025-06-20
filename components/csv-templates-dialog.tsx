"use client";

import type React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CSV_TEMPLATES,
  downloadCSVTemplate,
  type CSVTemplate,
} from "@/lib/utils/csv-templates";
import { Download, FileText, Info } from "lucide-react";
import { useState } from "react";

interface CSVTemplatesDialogProps {
  children: React.ReactNode;
}

export default function CSVTemplatesDialog({
  children,
}: CSVTemplatesDialogProps) {
  const [open, setOpen] = useState(false);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  const handleDownload = (template: CSVTemplate) => {
    downloadCSVTemplate(template);
  };

  const toggleExpanded = (templateName: string) => {
    setExpandedTemplate(
      expandedTemplate === templateName ? null : templateName
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-forest-800 flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>CSV Import Templates</span>
          </DialogTitle>
          <DialogDescription className="text-forest-600">
            Download pre-formatted CSV templates to make importing your time
            tracking data easier.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {CSV_TEMPLATES.map((template) => (
            <Card key={template.name} className="forest-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-forest-800 text-lg">
                      {template.name}
                    </CardTitle>
                    <CardDescription className="text-forest-600">
                      {template.description}
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => handleDownload(template)}
                    className="forest-gradient hover:from-forest-600 hover:to-forest-800 text-white"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Headers Preview */}
                <div>
                  <h4 className="text-sm font-medium text-forest-800 mb-2">
                    CSV Columns:
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {template.headers.map((header) => (
                      <Badge
                        key={header}
                        variant="secondary"
                        className="bg-forest-100 text-forest-700 text-xs"
                      >
                        {header}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Expandable Instructions */}
                <Collapsible
                  open={expandedTemplate === template.name}
                  onOpenChange={() => toggleExpanded(template.name)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-forest-600 hover:text-forest-800 p-0 h-auto"
                    >
                      <Info className="h-4 w-4 mr-1" />
                      {expandedTemplate === template.name
                        ? "Hide"
                        : "Show"}{" "}
                      Instructions & Sample Data
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 mt-4">
                    {/* Instructions */}
                    <div>
                      <h4 className="text-sm font-medium text-forest-800 mb-2">
                        Instructions:
                      </h4>
                      <ul className="text-sm text-forest-600 space-y-1">
                        {template.instructions.map((instruction, index) => (
                          <li
                            key={index}
                            className="flex items-start space-x-2"
                          >
                            <span className="text-forest-400 mt-1">•</span>
                            <span>{instruction}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Sample Data Preview */}
                    <div>
                      <h4 className="text-sm font-medium text-forest-800 mb-2">
                        Sample Data:
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border border-forest-200 rounded-lg">
                          <thead>
                            <tr className="bg-forest-50">
                              {template.headers.map((header) => (
                                <th
                                  key={header}
                                  className="px-3 py-2 text-left font-medium text-forest-700 border-b border-forest-200"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {template.sampleData
                              .slice(0, 3)
                              .map((row, rowIndex) => (
                                <tr
                                  key={rowIndex}
                                  className="border-b border-forest-100"
                                >
                                  {row.map((cell, cellIndex) => (
                                    <td
                                      key={cellIndex}
                                      className="px-3 py-2 text-forest-600"
                                    >
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                          </tbody>
                        </table>
                        {template.sampleData.length > 3 && (
                          <p className="text-xs text-forest-500 mt-2">
                            ... and {template.sampleData.length - 3} more sample
                            rows in the download
                          </p>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="border-t border-forest-200 pt-4">
          <div className="bg-forest-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-forest-800 mb-2">
              💡 Pro Tips:
            </h4>
            <ul className="text-sm text-forest-600 space-y-1">
              <li>
                • Download the template that best matches your current time
                tracking format
              </li>
              <li>
                • You can modify the templates to include additional columns
                (they'll be ignored during import)
              </li>
              <li>
                • Always test with a small sample before importing large
                datasets
              </li>
              <li>
                • Use the preview step to verify your data is mapped correctly
              </li>
              <li>• Keep your original files as backups before importing</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
