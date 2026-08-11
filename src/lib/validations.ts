import { z } from "zod";

export const CycleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  month: z.union([z.string(), z.number()]).optional().transform(val => val ? String(val) : null),
  year: z.union([z.string(), z.number()]).optional().transform(val => val ? String(val) : null),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  isActive: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  bpRemarks: z.string().optional(),
  rpRemarks: z.string().optional()
});

export const SuggestionSchema = z.object({
  guestName: z.string().default("Anonymous"),
  guestDept: z.string().default("General"),
  suggestionText: z.string().min(1, "Suggestion text is required"),
  submissionId: z.string().nullable().optional()
});

export const SubmissionSchema = z.object({
  type: z.enum(["BestPractice", "RepetitiveProblem", "SupportingSlide"]),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["Draft", "Submitted", "Reviewed", "Accepted"]).default("Submitted"),
  deadline: z.string().or(z.date()).optional(),
  
  beforeImageUrl: z.string().nullable().optional(),
  afterImageUrl: z.string().nullable().optional(),
  attachmentUrl: z.string().nullable().optional(),
  
  objective: z.string().optional(),
  problemAddressed: z.string().optional(),
  methodology: z.string().optional(),
  impactSavings: z.union([z.string(), z.number()]).optional().transform(val => val ? parseFloat(String(val)) : null),
  calculationTable: z.any().optional(),
  
  equipmentDetails: z.string().optional(),
  problemStatement: z.string().optional(),
  impactCalculation: z.any().optional(),
  whyWhyAnalysis: z.any().optional(),
  actionTakenTable: z.any().optional(),

  supportingSlideType: z.enum(["BestPractice", "RepetitiveProblem", "SupportingSlide"]).optional(),
  customTable: z.any().optional(),
  supportingImages: z.array(z.string()).optional(),
  
  severity: z.string().optional(),
  
  cycleId: z.string().nullable().optional(),
});
