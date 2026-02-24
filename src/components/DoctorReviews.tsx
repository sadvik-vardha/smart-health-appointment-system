import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFeedbackByDoctor } from "@/lib/supabase-storage";
import { Feedback } from "@/types/healthcare";
import { format } from "date-fns";

interface DoctorReviewsProps {
  doctorId: string;
  showTitle?: boolean;
  maxReviews?: number;
}

export const DoctorReviews = ({
  doctorId,
  showTitle = true,
  maxReviews = 5,
}: DoctorReviewsProps) => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFeedbackByDoctor(doctorId).then(fb => {
      setFeedback(fb);
      setLoading(false);
    });
  }, [doctorId]);

  if (loading || feedback.length === 0) return null;

  const averageRating = feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length;
  const displayedReviews = feedback.slice(0, maxReviews);

  return (
    <Card>
      {showTitle && (
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            Patient Reviews
            <span className="flex items-center text-sm font-normal text-muted-foreground">
              <Star className="w-4 h-4 text-warning fill-warning mr-1" />
              {averageRating.toFixed(1)} ({feedback.length} {feedback.length === 1 ? "review" : "reviews"})
            </span>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {displayedReviews.map((review) => (
          <div key={review.id} className="border-b last:border-0 pb-3 last:pb-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className={`w-3 h-3 ${star <= review.rating ? "text-warning fill-warning" : "text-muted"}`} />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">{format(new Date(review.createdAt), "MMM d, yyyy")}</span>
            </div>
            {review.reviewText && <p className="text-sm text-muted-foreground">{review.reviewText}</p>}
          </div>
        ))}
        {feedback.length > maxReviews && (
          <p className="text-xs text-muted-foreground text-center">+{feedback.length - maxReviews} more reviews</p>
        )}
      </CardContent>
    </Card>
  );
};

export const DoctorRatingBadge = ({ doctorId }: { doctorId: string }) => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFeedbackByDoctor(doctorId).then(fb => {
      setFeedback(fb);
      setLoading(false);
    });
  }, [doctorId]);

  if (loading) return <span className="text-xs text-muted-foreground">...</span>;

  if (feedback.length === 0) {
    return <span className="text-xs text-muted-foreground">No reviews yet</span>;
  }

  const averageRating = feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length;

  return (
    <div className="flex items-center gap-1">
      <Star className="w-4 h-4 text-warning fill-warning" />
      <span className="text-sm font-medium">{averageRating.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">({feedback.length})</span>
    </div>
  );
};

export default DoctorReviews;
