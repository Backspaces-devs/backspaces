"use client";

import React, { useState } from "react";
import {
  Video,
  Search,
  Calendar,
  History,
  Users,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import connectData from "@/app/MockDataFolder/connectData.json";
import {
  AssignedMentorCard,
  type Mentor,
} from "@/components/shell/connect/AssignedMentorCard";
import {
  UpcomingMeetingsList,
  type UpcomingMeeting,
} from "@/components/shell/connect/UpcomingMeetingsList";
import {
  PastMeetingsList,
  type PastMeeting,
} from "@/components/shell/connect/PastMeetingsList";
import { MeetingFeedbackDialog } from "@/components/shell/connect/MeetingFeedbackDialog";
import { ScheduleMeetingDialog } from "@/components/shell/connect/ScheduleMeetingDialog";
import {
  MentorDirectoryDialog,
  type DatabaseMentor,
} from "@/components/shell/connect/MentorDirectoryDialog";
import { QuickDoubtDialog } from "@/components/shell/connect/QuickDoubtDialog";
import { cn } from "@/lib/utils";

type TabType = "all" | "upcoming" | "past";

export default function ConnectPage() {
  const [assignedMentor] = useState<Mentor>(
    connectData.assignedMentor
  );
  const [otherAssignedMentors, setOtherAssignedMentors] = useState<Mentor[]>(
    connectData.otherAssignedMentors || []
  );
  const [upcomingMeetings, setUpcomingMeetings] = useState<UpcomingMeeting[]>(
    connectData.upcomingMeetings as UpcomingMeeting[]
  );
  const [pastMeetings] = useState<PastMeeting[]>(
    connectData.pastMeetings as PastMeeting[]
  );
  const [mentorDatabase] = useState<DatabaseMentor[]>(
    connectData.mentorDatabase as DatabaseMentor[]
  );

  const [activeTab, setActiveTab] = useState<TabType>("all");

  const [selectedPastMeeting, setSelectedPastMeeting] =
    useState<PastMeeting | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const [schedulingMentor, setSchedulingMentor] = useState<Mentor | null>(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);

  const [doubtMentor, setDoubtMentor] = useState<Mentor | null>(null);
  const [isDoubtOpen, setIsDoubtOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenSchedule = (mentorToBook: Mentor) => {
    setSchedulingMentor(mentorToBook);
    setIsScheduleOpen(true);
  };

  const handleOpenQuickDoubt = (targetMentor: Mentor) => {
    setDoubtMentor(targetMentor);
    setIsDoubtOpen(true);
  };

  // When meeting is scheduled, add to upcoming meetings AND update active mentor cards
  const handleMeetingScheduled = (newMeeting: UpcomingMeeting) => {
    setUpcomingMeetings((prev) => [newMeeting, ...prev]);

    // Rule: "one mentor will always be showing there tagged as assigned mentor and others will only show when there a meeting assigned"
    if (newMeeting.mentorId !== assignedMentor.id) {
      const existsInOther = otherAssignedMentors.some(
        (m) => m.id === newMeeting.mentorId
      );
      if (!existsInOther) {
        const dbMentor = mentorDatabase.find(
          (m) => m.id === newMeeting.mentorId
        );
        const newAssignedEntry: Mentor = dbMentor
          ? {
              id: dbMentor.id,
              name: dbMentor.name,
              role: dbMentor.role,
              company: dbMentor.company,
              avatar: dbMentor.avatar,
              bio: dbMentor.bio,
              rating: dbMentor.rating,
              totalSessions: dbMentor.totalSessions,
              tags: dbMentor.tags,
              status: "Meeting Scheduled",
            }
          : {
              id: newMeeting.mentorId,
              name: newMeeting.mentorName,
              role: newMeeting.mentorRole,
              company: "Verified Partner",
              avatar: newMeeting.mentorAvatar,
              bio: "Assigned Session Mentor",
              rating: 4.9,
              totalSessions: 50,
              tags: [newMeeting.type],
              status: "Meeting Scheduled",
            };

        setOtherAssignedMentors((prev) => [newAssignedEntry, ...prev]);
      }
    }

    triggerToast(
      `🎉 Zoom meeting with ${newMeeting.mentorName} scheduled for ${newMeeting.date}!`
    );
  };

  const handleCancelMeeting = (meetingId: string) => {
    const meetingToCancel = upcomingMeetings.find((m) => m.id === meetingId);
    setUpcomingMeetings((prev) => prev.filter((m) => m.id !== meetingId));

    if (meetingToCancel && meetingToCancel.mentorId !== assignedMentor.id) {
      const otherMeetingsWithMentor = upcomingMeetings.filter(
        (m) => m.id !== meetingId && m.mentorId === meetingToCancel.mentorId
      );
      if (otherMeetingsWithMentor.length === 0) {
        setOtherAssignedMentors((prev) =>
          prev.filter((m) => m.id !== meetingToCancel.mentorId)
        );
      }
    }

    triggerToast("Meeting was cancelled.");
  };

  const handleOpenFeedback = (meeting: PastMeeting) => {
    setSelectedPastMeeting(meeting);
    setIsFeedbackOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-500/95 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold backdrop-blur-md border border-emerald-400/30 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="size-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header section with CTAs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              <ShieldCheck className="size-3" />
              1:1 Live Mentorship
            </span>
            <span className="text-xs text-white/40">
              Powered by Zoom Real-time
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Mentor Connect &amp; Doubt Clinic
          </h1>
          <p className="text-xs sm:text-sm text-white/50 mt-1 max-w-2xl leading-relaxed">
            Stuck on a tricky DSA problem, code architecture, or interview prep?
            Meet 1:1 with verified senior engineers over Zoom for live screen
            sharing and doubt resolution.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsDirectoryOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium transition-colors"
          >
            <Search className="size-3.5 text-white/60" />
            <span>Search Mentor Database</span>
          </button>

          <button
            onClick={() => handleOpenSchedule(assignedMentor)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black hover:bg-white/90 text-xs font-semibold shadow-lg shadow-white/10 transition-all hover:scale-[1.02]"
          >
            <Video className="size-3.5 fill-black" />
            <span>Book 1:1 Session</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 flex flex-col justify-between">
          <span className="text-xs text-white/40 font-medium">Assigned Mentor</span>
          <div className="flex items-center justify-between mt-2">
            <p className="text-lg sm:text-xl font-bold text-white truncate">
              {assignedMentor.name}
            </p>
            <span className="size-2 rounded-full bg-emerald-400" />
          </div>
          <span className="text-[11px] text-emerald-400/80 mt-1">
            {assignedMentor.company}
          </span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 flex flex-col justify-between">
          <span className="text-xs text-white/40 font-medium">Upcoming Sessions</span>
          <p className="text-xl sm:text-2xl font-bold text-white mt-1">
            {upcomingMeetings.length}
          </p>
          <span className="text-[11px] text-blue-400 mt-1">
            {upcomingMeetings.length > 0 ? "Next: Tomorrow 4:30 PM" : "Ready to book"}
          </span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 flex flex-col justify-between">
          <span className="text-xs text-white/40 font-medium">Completed Sessions</span>
          <p className="text-xl sm:text-2xl font-bold text-white mt-1">
            {pastMeetings.length}
          </p>
          <span className="text-[11px] text-white/40 mt-1">
            Feedback &amp; Notes Logged
          </span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 flex flex-col justify-between">
          <span className="text-xs text-white/40 font-medium">Meeting Platform</span>
          <div className="flex items-center gap-1.5 mt-1">
            <Video className="size-4 text-blue-400" />
            <p className="text-base sm:text-lg font-bold text-white">Zoom 1:1</p>
          </div>
          <span className="text-[11px] text-white/40 mt-1">
            Auto Link &amp; Calendar Sync
          </span>
        </div>
      </div>

      {/* Assigned Mentors Section */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              Your Mentors
            </h2>
          </div>
          <span className="text-xs text-white/40">
            {1 + otherAssignedMentors.length} active
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <AssignedMentorCard
            mentor={assignedMentor}
            isPrimary={true}
            onScheduleMeeting={handleOpenSchedule}
            onQuickDoubt={handleOpenQuickDoubt}
          />

          {otherAssignedMentors.map((mentor) => (
            <AssignedMentorCard
              key={mentor.id}
              mentor={mentor}
              isPrimary={false}
              onScheduleMeeting={handleOpenSchedule}
              onQuickDoubt={handleOpenQuickDoubt}
            />
          ))}
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.08]">
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1">
          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors",
              activeTab === "all"
                ? "bg-white text-black font-semibold shadow"
                : "text-white/50 hover:text-white"
            )}
          >
            All Meetings
          </button>

          <button
            onClick={() => setActiveTab("upcoming")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5",
              activeTab === "upcoming"
                ? "bg-white text-black font-semibold shadow"
                : "text-white/50 hover:text-white"
            )}
          >
            <span>Upcoming ({upcomingMeetings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("past")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5",
              activeTab === "past"
                ? "bg-white text-black font-semibold shadow"
                : "text-white/50 hover:text-white"
            )}
          >
            <span>Past &amp; Feedback ({pastMeetings.length})</span>
          </button>
        </div>

        <button
          onClick={() => setIsDirectoryOpen(true)}
          className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1 transition-colors"
        >
          <span>Need a different specialist? Browse Database</span>
          <span>→</span>
        </button>
      </div>

      {/* Section: Upcoming Meetings */}
      {(activeTab === "all" || activeTab === "upcoming") && (
        <section>
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-blue-400" />
              <h2 className="text-base sm:text-lg font-bold text-white">
                Upcoming Zoom Sessions
              </h2>
            </div>
            {upcomingMeetings.length > 0 && (
              <button
                onClick={() => handleOpenSchedule(assignedMentor)}
                className="text-xs text-white/50 hover:text-white transition-colors"
              >
                + Schedule Another
              </button>
            )}
          </div>

          <UpcomingMeetingsList
            meetings={upcomingMeetings}
            onScheduleNew={() => handleOpenSchedule(assignedMentor)}
            onCancelMeeting={handleCancelMeeting}
          />
        </section>
      )}

      {/* Section: Past Meetings & Feedback Vault */}
      {(activeTab === "all" || activeTab === "past") && (
        <section>
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <History className="size-4 text-emerald-400" />
              <h2 className="text-base sm:text-lg font-bold text-white">
                Past Sessions &amp; Mentor Feedback
              </h2>
            </div>
            <span className="text-xs text-white/40">
              Click any session to view notes &amp; code evaluation
            </span>
          </div>

          <PastMeetingsList
            meetings={pastMeetings}
            onOpenFeedback={handleOpenFeedback}
          />
        </section>
      )}

      {/* Dialogs */}
      <MeetingFeedbackDialog
        open={isFeedbackOpen}
        onOpenChange={setIsFeedbackOpen}
        meeting={selectedPastMeeting}
      />

      <ScheduleMeetingDialog
        open={isScheduleOpen}
        onOpenChange={setIsScheduleOpen}
        mentor={schedulingMentor}
        onConfirmSchedule={handleMeetingScheduled}
      />

      <MentorDirectoryDialog
        open={isDirectoryOpen}
        onOpenChange={setIsDirectoryOpen}
        mentors={mentorDatabase}
        onSelectMentorToBook={handleOpenSchedule}
      />

      <QuickDoubtDialog
        open={isDoubtOpen}
        onOpenChange={setIsDoubtOpen}
        mentor={doubtMentor}
        onSubmitDoubt={(d) => {
          triggerToast(`Doubt submitted to ${d.mentorName}!`);
        }}
      />
    </div>
  );
}