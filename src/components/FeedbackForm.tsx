import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generateId } from "@/lib/storage";
import { saveFeedback, getFeedbackByBookingId } from "@/lib/supabase-storage";
import { Feedback } from "@/types/healthcare";

interface FeedbackFormProps {
  bookingId: string;
  doctorId: string;
  hospitalId: string;
  patientId: string;
  doctorName: string;
  hospitalName: string;
  onSubmit?: () => void;
}

export const FeedbackForm = ({
  bookingId, doctorId, hospitalId, patientId, doctorName, hospitalName, onSubmit,
}: FeedbackFormProps) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFeedbackByBookingId(bookingId).then(fb => {
      setExistingFeedback(fb || null);
      setLoading(false);
    });
  }, [bookingId]);

  if (loading) return null;

  if (existingFeedback) {
    return (
      <Card className="border-success/30 bg-success/5">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-success">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm font-medium">Feedback submitted - Thank you!</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: "Rating required", description: "Please select a star rating.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const feedback: Feedback = {
      id: generateId(),
      bookingId, doctorId, hospitalId, patientId,
      rating, reviewText: reviewText.trim(),
      createdAt: new Date().toISOString(),
    };
    await saveFeedback(feedback);
    toast({ title: "Feedback submitted", description: "Thank you for your feedback!" });
    setIsSubmitting(false);
    onSubmit?.();
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Rate Your Experience</CardTitle>
        <p className="text-sm text-muted-foreground">Dr. {doctorName} at {hospitalName}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Rating</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button" className="p-1 transition-transform hover:scale-110"
                onMouseEnter={() => setHoveredRating(star)} onMouseLeave={() => setHoveredRating(0)} onClick={() => setRating(star)}>
                <Star className={`w-8 h-8 ${star <= (hoveredRating || rating) ? "text-warning fill-warning" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="review">Your Review (optional)</Label>
          <Textarea id="review" placeholder="Share your experience with this doctor..." value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={3} />
        </div>
        <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0} className="w-full gradient-primary">
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default FeedbackForm;
