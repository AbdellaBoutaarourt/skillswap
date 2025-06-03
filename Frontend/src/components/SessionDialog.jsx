import { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { toast } from "sonner";
import axios from "axios";

export default function SessionDialog({ open, onOpenChange, selectedUser, onSessionScheduled }) {
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(null);
  const [formData, setFormData] = useState({
    start_time: "",
    end_time: "",
    mode: "online",
    location: "",
    notes: "",
    skill_request_id: ""
  });
  const [acceptedSkills, setAcceptedSkills] = useState([]);

  useEffect(() => {
    if (!open || !selectedUser) return;
    const user = JSON.parse(localStorage.getItem("user"));
    axios.get(`http://localhost:5000/skills/skill-requests/user/${user.id}`)
      .then(({ data }) => {
        const accepted = data.filter(req =>
          req.status === 'accepted' &&
          ((req.requester_id === user.id && req.receiver_id === selectedUser.id) ||
           (req.requester_id === selectedUser.id && req.receiver_id === user.id))
        );
         const uniqueBySkill = Object.values(
          accepted.reduce((acc, curr) => {
            if (!acc[curr.requested_skill]) {
              acc[curr.requested_skill] = curr;
            }
            return acc;
          }, {})
        );

        setAcceptedSkills(uniqueBySkill);

      });
  }, [open, selectedUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date) {
      toast.error("Please select a date");
      return;
    }
    if (!formData.skill_request_id) {
      toast.error("Please select a skill");
      return;
    }
    setLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      // Create the session
      const response = await axios.post("http://localhost:5000/sessions", {
        skill_request_id: formData.skill_request_id,
        scheduled_by: user.id,
        scheduled_with: selectedUser.id,
        date: format(date, "yyyy-MM-dd"),
        start_time: formData.start_time,
        end_time: formData.end_time,
        mode: formData.mode,
        location: formData.location,
        notes: formData.notes
      });

      toast.success("Session request sent successfully!");
      onSessionScheduled(response.data);
      onOpenChange(false);
    } catch (error) {
      console.error("Error scheduling session:", error);
      toast.error(error.response?.data?.message || "Failed to schedule session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[425px] bg-[#1a2634] text-white border-white/20">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Schedule a Session</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Skill</Label>
            <Select
              value={formData.skill_request_id}
              onValueChange={value => setFormData({ ...formData, skill_request_id: value })}
              required
            >
              <SelectTrigger className="bg-[#181f25] border-gray-700">
                <SelectValue placeholder="Select a skill" />
              </SelectTrigger>
              <SelectContent className="bg-[#181f25] border-gray-700 text-white">
                {acceptedSkills.length === 0 ? (
                    <div className="px-4 py-2 text-sm text-gray-400">No accepted skills</div>
                ) : (
                  acceptedSkills.map(req => (
                    <SelectItem key={req.id} value={req.id}>{req.requested_skill}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full cursor-pointer justify-start text-left font-normal bg-[#181f25] border-gray-700",
                    !date && "text-gray-400"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#181f25] border-gray-700">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="bg-[#181f25] text-white"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <div className="relative">
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                  className="bg-[#181f25] border-gray-700 [&::-webkit-calendar-picker-indicator]:invert cursor-pointer"
                  style={{ cursor: 'pointer' }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <div className="relative">
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                  className="bg-[#181f25] border-gray-700 [&::-webkit-calendar-picker-indicator]:invert cursor-pointer"
                  style={{ cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mode">Mode</Label>
            <Select
              value={formData.mode}
              onValueChange={(value) => setFormData({ ...formData, mode: value })}
            >
              <SelectTrigger className="bg-[#181f25] border-gray-700">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent className="bg-[#181f25] border-gray-700 text-white">
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="in_person">In Person</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.mode === "in_person" && (
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
                placeholder="Enter meeting location"
                className="bg-[#181f25] border-gray-700"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes"
              className="bg-[#181f25] border-gray-700"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-white cursor-pointer text-black font-medium rounded-lg text-base transition hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 font-medium hover:bg-blue-700">
              {loading ? "Sending..." : "Send Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

SessionDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  selectedUser: PropTypes.shape({
    id: PropTypes.string.isRequired
  }),
  onSessionScheduled: PropTypes.func.isRequired
};