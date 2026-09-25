export type FeedbackStatus = "In Review" | "Planned" | "In Progress" | "Implemented";

export type FeedbackType =
  | "Feature Request"
  | "Bug Report"
  | "Improvement"
  | "Other";

export interface FeedbackItem {
  id: string;
  title: string;
  description: string;
  type: FeedbackType;
  category: string;
  status: FeedbackStatus;
  date: string;
  votes: number;
  comments: number;
  mine?: boolean;
}
