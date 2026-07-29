import { Submission, Suggestion, Department, User, ActionItem, Team } from "@prisma/client";

export type SuggestionWithRelations = Suggestion & {
  assignedTeam?: Team & { members: User[] } | null;
  submission?: Submission | null;
};

export type SubmissionWithRelations = Submission & {
  department: Department;
  suggestions?: SuggestionWithRelations[];
  adoptions?: any[];
  user?: User;
};

export interface ChartDataSets {
  trendLabels: string[];
  bestPracticesData: number[];
  repetitiveProblemsData: number[];
  impactLabels: string[];
  impactDataValues: number[];
}
