"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Video,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  UserCheck,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  CalendarX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import type {
  AppointmentRecord,
  AppointmentDetail,
  AppointmentStats,
  AppointmentStatus,
  AppointmentType,
  AppointmentTypeInfo,
  CreateAppointmentData,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Status badge colors
const statusColors: Record<AppointmentStatus, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  checked_in: "bg-purple-100 text-purple-800",
  in_progress: "bg-indigo-100 text-indigo-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
  no_show: "bg-orange-100 text-orange-800",
  rescheduled: "bg-pink-100 text-pink-800",
};

const statusLabels: Record<AppointmentStatus, string> = {
  scheduled: "Scheduled",
  pending: "Pending",
  confirmed: "Confirmed",
  checked_in: "Checked In",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
  rescheduled: "Rescheduled",
};

const typeLabels: Record<AppointmentType, string> = {
  new_patient: "New Patient",
  follow_up: "Follow-up",
  annual_physical: "Annual Physical",
  sick_visit: "Sick Visit",
  consultation: "Consultation",
  procedure: "Procedure",
  telehealth: "Telehealth",
  urgent_care: "Urgent Care",
  lab_work: "Lab Work",
  imaging: "Imaging",
  vaccination: "Vaccination",
  other: "Other",
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentTypeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDetail | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Create form state
  const [createForm, setCreateForm] = useState<CreateAppointmentData>({
    patient_id: "",
    patient_name: "",
    patient_email: "",
    patient_phone: "",
    provider_name: "",
    department: "",
    appointment_type: "follow_up",
    scheduled_start: "",
    duration_minutes: 30,
    location: "",
    is_telehealth: false,
    reason_for_visit: "",
  });

  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    try {
      let url = `${API_BASE}/api/v1/appointments/?limit=100`;
      if (statusFilter !== "all") {
        url += `&status=${statusFilter}`;
      }
      if (typeFilter !== "all") {
        url += `&appointment_type=${typeFilter}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch appointments");
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      toast.error("Failed to load appointments");
      console.error(error);
    }
  }, [statusFilter, typeFilter]);

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/appointments/stats`);
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch appointment types
  const fetchTypes = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/appointments/types`);
      if (!response.ok) throw new Error("Failed to fetch types");
      const data = await response.json();
      setAppointmentTypes(data);
    } catch (error) {
      console.error(error);
    }
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAppointments(), fetchStats(), fetchTypes()]);
      setLoading(false);
    };
    loadData();
  }, [fetchAppointments]);

  // Reload when filters change
  useEffect(() => {
    fetchAppointments();
  }, [statusFilter, typeFilter, fetchAppointments]);

  // Search appointments
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchAppointments();
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE}/api/v1/appointments/search?q=${encodeURIComponent(searchQuery)}`
      );
      if (!response.ok) throw new Error("Search failed");
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      toast.error("Search failed");
      console.error(error);
    }
  };

  // Create appointment
  const handleCreate = async () => {
    if (!createForm.patient_id || !createForm.patient_name || !createForm.scheduled_start) {
      toast.error("Please fill in required fields");
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/appointments/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      if (!response.ok) throw new Error("Failed to create appointment");

      toast.success("Appointment created successfully");
      setShowCreateDialog(false);
      resetCreateForm();
      fetchAppointments();
      fetchStats();
    } catch (error) {
      toast.error("Failed to create appointment");
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  // View appointment details
  const handleViewDetails = async (appointmentId: number) => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/appointments/${appointmentId}`);
      if (!response.ok) throw new Error("Failed to fetch details");
      const data = await response.json();
      setSelectedAppointment(data);
      setShowDetailDialog(true);
    } catch (error) {
      toast.error("Failed to load appointment details");
      console.error(error);
    }
  };

  // Appointment actions
  const handleCheckIn = async (appointmentId: number) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/appointments/${appointmentId}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error("Failed to check in");
      toast.success("Patient checked in");
      fetchAppointments();
      fetchStats();
      if (selectedAppointment?.id === appointmentId) {
        handleViewDetails(appointmentId);
      }
    } catch (error) {
      toast.error("Failed to check in patient");
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = async (appointmentId: number) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/appointments/${appointmentId}/start`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to start");
      toast.success("Appointment started");
      fetchAppointments();
      fetchStats();
      if (selectedAppointment?.id === appointmentId) {
        handleViewDetails(appointmentId);
      }
    } catch (error) {
      toast.error("Failed to start appointment");
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (appointmentId: number) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/appointments/${appointmentId}/complete`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to complete");
      toast.success("Appointment completed");
      fetchAppointments();
      fetchStats();
      if (selectedAppointment?.id === appointmentId) {
        handleViewDetails(appointmentId);
      }
    } catch (error) {
      toast.error("Failed to complete appointment");
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (appointmentId: number) => {
    const reason = prompt("Please provide a reason for cancellation:");
    if (!reason) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/appointments/${appointmentId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error("Failed to cancel");
      toast.success("Appointment cancelled");
      fetchAppointments();
      fetchStats();
      setShowDetailDialog(false);
    } catch (error) {
      toast.error("Failed to cancel appointment");
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleNoShow = async (appointmentId: number) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/appointments/${appointmentId}/no-show`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to mark no-show");
      toast.success("Marked as no-show");
      fetchAppointments();
      fetchStats();
      if (selectedAppointment?.id === appointmentId) {
        handleViewDetails(appointmentId);
      }
    } catch (error) {
      toast.error("Failed to mark no-show");
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (appointmentId: number) => {
    if (!confirm("Are you sure you want to delete this appointment?")) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/appointments/${appointmentId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      toast.success("Appointment deleted");
      fetchAppointments();
      fetchStats();
      setShowDetailDialog(false);
    } catch (error) {
      toast.error("Failed to delete appointment");
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      patient_id: "",
      patient_name: "",
      patient_email: "",
      patient_phone: "",
      provider_name: "",
      department: "",
      appointment_type: "follow_up",
      scheduled_start: "",
      duration_minutes: 30,
      location: "",
      is_telehealth: false,
      reason_for_visit: "",
    });
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="text-muted-foreground">Manage patient appointments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { fetchAppointments(); fetchStats(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Today</CardDescription>
              <CardTitle className="text-2xl">{stats.today_appointments}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Upcoming</CardDescription>
              <CardTitle className="text-2xl">{stats.upcoming_appointments}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Completed Today</CardDescription>
              <CardTitle className="text-2xl text-green-600">{stats.completed_today}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Cancelled Today</CardDescription>
              <CardTitle className="text-2xl text-red-600">{stats.cancelled_today}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>No Shows</CardDescription>
              <CardTitle className="text-2xl text-orange-600">{stats.no_shows_today}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total</CardDescription>
              <CardTitle className="text-2xl">{stats.total_appointments}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex gap-2 flex-1 min-w-[300px]">
          <Input
            placeholder="Search patients, providers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button variant="outline" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="checked_in">Checked In</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="no_show">No Show</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {appointmentTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Appointments List */}
      <div className="border rounded-lg">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No appointments found. Click &quot;New Appointment&quot; to schedule one.
          </div>
        ) : (
          <div className="divide-y">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="p-4 hover:bg-muted/50 cursor-pointer flex items-center justify-between gap-4"
                onClick={() => handleViewDetails(appointment.id)}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{appointment.patient_name}</span>
                      {appointment.is_telehealth && (
                        <Video className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDateTime(appointment.scheduled_start)}
                      <span className="text-xs">({appointment.duration_minutes} min)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-sm text-right hidden md:block">
                    <div>{typeLabels[appointment.appointment_type]}</div>
                    {appointment.provider_name && (
                      <div className="text-muted-foreground">{appointment.provider_name}</div>
                    )}
                  </div>

                  <Badge className={statusColors[appointment.status]}>
                    {statusLabels[appointment.status]}
                  </Badge>

                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    {appointment.status === "scheduled" || appointment.status === "confirmed" ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCheckIn(appointment.id)}
                          disabled={actionLoading}
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancel(appointment.id)}
                          disabled={actionLoading}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    ) : appointment.status === "checked_in" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStart(appointment.id)}
                        disabled={actionLoading}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    ) : appointment.status === "in_progress" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleComplete(appointment.id)}
                        disabled={actionLoading}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Appointment Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule New Appointment</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new appointment.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="patient_id">Patient ID *</Label>
                <Input
                  id="patient_id"
                  value={createForm.patient_id}
                  onChange={(e) => setCreateForm({ ...createForm, patient_id: e.target.value })}
                  placeholder="Enter patient ID"
                />
              </div>
              <div>
                <Label htmlFor="patient_name">Patient Name *</Label>
                <Input
                  id="patient_name"
                  value={createForm.patient_name}
                  onChange={(e) => setCreateForm({ ...createForm, patient_name: e.target.value })}
                  placeholder="Enter patient name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="patient_email">Patient Email</Label>
                <Input
                  id="patient_email"
                  type="email"
                  value={createForm.patient_email}
                  onChange={(e) => setCreateForm({ ...createForm, patient_email: e.target.value })}
                  placeholder="patient@email.com"
                />
              </div>
              <div>
                <Label htmlFor="patient_phone">Patient Phone</Label>
                <Input
                  id="patient_phone"
                  value={createForm.patient_phone}
                  onChange={(e) => setCreateForm({ ...createForm, patient_phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="provider_name">Provider Name</Label>
                <Input
                  id="provider_name"
                  value={createForm.provider_name}
                  onChange={(e) => setCreateForm({ ...createForm, provider_name: e.target.value })}
                  placeholder="Dr. Smith"
                />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={createForm.department}
                  onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                  placeholder="Family Medicine"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="appointment_type">Appointment Type</Label>
                <Select
                  value={createForm.appointment_type}
                  onValueChange={(value) =>
                    setCreateForm({ ...createForm, appointment_type: value as AppointmentType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {appointmentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label} ({type.default_duration} min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={createForm.duration_minutes}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, duration_minutes: parseInt(e.target.value) || 30 })
                  }
                  min={5}
                  max={480}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scheduled_start">Date & Time *</Label>
                <Input
                  id="scheduled_start"
                  type="datetime-local"
                  value={createForm.scheduled_start}
                  onChange={(e) => setCreateForm({ ...createForm, scheduled_start: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={createForm.location}
                  onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                  placeholder="Room 101"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_telehealth"
                checked={createForm.is_telehealth}
                onChange={(e) => setCreateForm({ ...createForm, is_telehealth: e.target.checked })}
              />
              <Label htmlFor="is_telehealth">Telehealth Appointment</Label>
            </div>

            <div>
              <Label htmlFor="reason_for_visit">Reason for Visit</Label>
              <Input
                id="reason_for_visit"
                value={createForm.reason_for_visit}
                onChange={(e) => setCreateForm({ ...createForm, reason_for_visit: e.target.value })}
                placeholder="Brief description of the reason for visit"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={actionLoading}>
              {actionLoading ? "Creating..." : "Create Appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedAppointment && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {selectedAppointment.patient_name}
                  </DialogTitle>
                  <Badge className={statusColors[selectedAppointment.status]}>
                    {statusLabels[selectedAppointment.status]}
                  </Badge>
                </div>
                <DialogDescription>
                  {typeLabels[selectedAppointment.appointment_type]} •{" "}
                  {formatDateTime(selectedAppointment.scheduled_start)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Patient Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Patient ID</h4>
                    <p>{selectedAppointment.patient_id}</p>
                  </div>
                  {selectedAppointment.patient_email && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Email</h4>
                      <p className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {selectedAppointment.patient_email}
                      </p>
                    </div>
                  )}
                  {selectedAppointment.patient_phone && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Phone</h4>
                      <p className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {selectedAppointment.patient_phone}
                      </p>
                    </div>
                  )}
                </div>

                {/* Provider Info */}
                {(selectedAppointment.provider_name || selectedAppointment.department) && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Provider</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedAppointment.provider_name && (
                        <div>
                          <p className="text-sm text-muted-foreground">Name</p>
                          <p>{selectedAppointment.provider_name}</p>
                        </div>
                      )}
                      {selectedAppointment.department && (
                        <div>
                          <p className="text-sm text-muted-foreground">Department</p>
                          <p>{selectedAppointment.department}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Appointment Details */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Appointment Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Start Time</p>
                      <p className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatTime(selectedAppointment.scheduled_start)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p>{selectedAppointment.duration_minutes} minutes</p>
                    </div>
                    {selectedAppointment.location && (
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {selectedAppointment.location}
                        </p>
                      </div>
                    )}
                    {selectedAppointment.is_telehealth && (
                      <div>
                        <p className="text-sm text-muted-foreground">Telehealth</p>
                        <p className="flex items-center gap-1 text-blue-600">
                          <Video className="h-4 w-4" />
                          Virtual Appointment
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reason for Visit */}
                {selectedAppointment.reason_for_visit && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Reason for Visit</h4>
                    <p className="text-sm">{selectedAppointment.reason_for_visit}</p>
                  </div>
                )}

                {/* AI Prep Notes */}
                {selectedAppointment.ai_prep_notes && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-500" />
                      AI Preparation Notes
                    </h4>
                    <p className="text-sm bg-blue-50 p-3 rounded-lg whitespace-pre-wrap">
                      {selectedAppointment.ai_prep_notes}
                    </p>
                  </div>
                )}

                {/* Notes */}
                {selectedAppointment.notes && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Notes</h4>
                    <p className="text-sm whitespace-pre-wrap">{selectedAppointment.notes}</p>
                  </div>
                )}

                {/* Cancellation Info */}
                {selectedAppointment.status === "cancelled" && selectedAppointment.cancellation_reason && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2 text-red-600">Cancellation Details</h4>
                    <p className="text-sm">{selectedAppointment.cancellation_reason}</p>
                    {selectedAppointment.cancelled_at && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Cancelled on {formatDateTime(selectedAppointment.cancelled_at)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter className="flex-wrap gap-2">
                {selectedAppointment.status === "scheduled" ||
                selectedAppointment.status === "confirmed" ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleCheckIn(selectedAppointment.id)}
                      disabled={actionLoading}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Check In
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleNoShow(selectedAppointment.id)}
                      disabled={actionLoading}
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      No Show
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleCancel(selectedAppointment.id)}
                      disabled={actionLoading}
                    >
                      <CalendarX className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                ) : selectedAppointment.status === "checked_in" ? (
                  <Button onClick={() => handleStart(selectedAppointment.id)} disabled={actionLoading}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Appointment
                  </Button>
                ) : selectedAppointment.status === "in_progress" ? (
                  <Button onClick={() => handleComplete(selectedAppointment.id)} disabled={actionLoading}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Complete
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  onClick={() => handleDelete(selectedAppointment.id)}
                  disabled={actionLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
